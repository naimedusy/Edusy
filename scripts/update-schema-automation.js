import fs from 'fs';

const filePath = 'f:/Edusy User flow/Edusy app/prisma/schema.prisma';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update Assignment model with scheduledDate
content = content.replace(
    /model Assignment {([\s\S]*?)updatedAt   DateTime @updatedAt/g,
    (match, body) => {
        if (body.includes('scheduledDate')) return match;
        return `model Assignment {${body}scheduledDate DateTime @default(now())\n  updatedAt   DateTime @updatedAt`;
    }
);

// 2. Update AssignmentStatus enum with RELEASED
content = content.replace(
    /enum AssignmentStatus {([\s\S]*?)}/g,
    (match, body) => {
        if (body.includes('RELEASED')) return match;
        return `enum AssignmentStatus {${body}  RELEASED\n}`;
    }
);

fs.writeFileSync(filePath, content);
console.log('Schema updated with daily automation fields');
