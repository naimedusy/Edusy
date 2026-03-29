import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');
        const studentId = searchParams.get('studentId');
        const role = searchParams.get('role');

        const where: any = {};
        // If querying for a specific student, only filter by studentId
        // (don't also require instituteId match — there may be slight ID format differences)
        if (studentId) {
            where.studentId = studentId;
        } else {
            // For the main accounts dashboard, always filter by instituteId
            if (!instituteId) {
                return NextResponse.json({ message: 'Institute ID is required' }, { status: 400 });
            }
            where.instituteId = instituteId;
        }
        if (role) where.role = role;

        const transactions = await (prisma as any).transaction.findMany({
            where,
            orderBy: { date: 'desc' }
        });

        // Calculate summary stats
        const totalIncome = transactions
            .filter((t: any) => t.type === 'INCOME' && t.status === 'COMPLETED')
            .reduce((sum: number, t: any) => sum + t.amount, 0);

        const totalExpense = transactions
            .filter((t: any) => t.type === 'EXPENSE' && t.status === 'COMPLETED')
            .reduce((sum: number, t: any) => sum + t.amount, 0);

        const pendingFees = transactions
            .filter((t: any) => t.type === 'INCOME' && t.status === 'PENDING')
            .reduce((sum: number, t: any) => sum + t.amount, 0);

        const balance = totalIncome - totalExpense;

        // For now, these are fixed, but could be calculated by comparing with previous month
        const summary = {
            totalIncome,
            totalExpense,
            pendingFees,
            balance,
            incomeChange: '+0%',
            expenseChange: '+0%',
            pendingChange: '+0%',
            balanceChange: '+0%'
        };

        return NextResponse.json({
            summary,
            transactions
        });
    } catch (error: any) {
        console.error('Accounts API Error:', error);
        return NextResponse.json({ 
            message: 'Internal server error', 
            error: error.message,
            availableModels: Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')),
            stack: error.stack
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { instituteId, ...rest } = data;

        if (!instituteId) {
            return NextResponse.json({ message: 'Institute ID is required' }, { status: 400 });
        }

        const transaction = await (prisma as any).transaction.create({
            data: {
                ...rest,
                instituteId,
                date: new Date(rest.date || Date.now())
            }
        });

        return NextResponse.json(transaction);
    } catch (error) {
        console.error('Create Transaction Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
