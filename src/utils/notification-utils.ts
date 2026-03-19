import prisma from './db';

export type NotificationType = 'TASK_COMPLETED' | 'ATTENDANCE_ALERT' | 'PERMISSION_UPDATE' | 'INVITATION' | 'SYSTEM';

interface NotificationTemplate {
    title: string;
    message: string;
}

interface InstituteNotificationSettings {
    [key: string]: {
        teacher?: NotificationTemplate;
        guardian?: NotificationTemplate;
        student?: NotificationTemplate;
        admin?: NotificationTemplate;
    }
}

const DEFAULT_TEMPLATES: any = {
    TASK_COMPLETED: {
        teacher: {
            title: "টাস্ক সম্পন্ন হয়েছে",
            message: "{{studentName}} \"{{bookName}}\"-এর একটি টাস্ক সম্পন্ন করেছেন।"
        },
        guardian: {
            title: "সন্তানের পড়া আপডেট",
            message: "আপনার আদরের সন্তান {{studentName}} আজ {{bookName}}-এর একটি পড়া শেষ করেছে।"
        },
        admin: {
            title: "শিক্ষার্থীর আপডেট",
            message: "{{studentName}} \"{{bookName}}\"-এর একটি টাস্ক আপডেট করেছেন।"
        }
    },
    ATTENDANCE_ALERT: {
        guardian: {
            title: "হাজিরা নিশ্চিতকরণ",
            message: "{{studentName}} আজ {{time}} মিনিটে নিরাপদে {{instituteName}} এ পৌঁছেছে।"
        }
    }
};

export function replaceVariables(template: string, variables: Record<string, string>) {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
}

export async function sendNotification({
    userIds,
    type,
    instituteId,
    variables,
    metadata = {}
}: {
    userIds: string[];
    type: NotificationType;
    instituteId: string;
    variables: Record<string, string>;
    metadata?: any;
}) {
    const institute = await prisma.institute.findUnique({
        where: { id: instituteId },
        select: { name: true, notificationSettings: true }
    });

    const settings = (institute?.notificationSettings as unknown as InstituteNotificationSettings) || {};
    const batchId = crypto.randomUUID();

    const notificationsPromises = userIds.map(async (userId) => {
        // Simple logic to determine target role for template mapping
        // In a real app, you might pass the role or fetch it
        let targetRole = 'student'; 
        if (metadata.role) targetRole = metadata.role.toLowerCase();

        const typeSettings = settings[type];
        const defaultTypeSettings = DEFAULT_TEMPLATES[type] as any;
        
        const template = (typeSettings as any)?.[targetRole] || defaultTypeSettings?.[targetRole];

        if (!template) return null;

        const title = replaceVariables(template.title, { ...variables, instituteName: institute?.name || '' });
        const message = replaceVariables(template.message, { ...variables, instituteName: institute?.name || '' });

        return prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                batchId,
                status: 'SENT',
                metadata: { ...metadata, instituteId, instituteName: institute?.name }
            }
        });
    });

    return Promise.all(notificationsPromises);
}
