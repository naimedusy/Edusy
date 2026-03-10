import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');

        if (!instituteId) {
            return NextResponse.json({ message: 'Institute ID is required' }, { status: 400 });
        }

        // Mock data for now, in a real app this would aggregate from a Transactions/Fees table
        const summary = {
            totalIncome: 125000,
            totalExpense: 45200,
            pendingFees: 80000,
            balance: 79800,
            incomeChange: '+12.5%',
            expenseChange: '+5.2%',
            pendingChange: '-2.1%',
            balanceChange: '+8.4%'
        };

        const recentTransactions = [
            { id: 'TXN001', student: 'আহমেদ কবির', class: 'দশম', amount: 5000, date: '১০ মার্চ, ২০২৬', status: 'COMPLETED', type: 'INCOME', category: 'মাসিক ফি' },
            { id: 'TXN002', student: 'সাফিয়া আক্তার', class: 'নবম', amount: 3000, date: '০৯ মার্চ, ২০২৬', status: 'COMPLETED', type: 'INCOME', category: 'ভর্তি ফি' },
            { id: 'TXN003', category: 'বিদ্যুৎ বিল', amount: 4500, date: '০৮ মার্চ, ২০২৬', status: 'COMPLETED', type: 'EXPENSE', note: 'ফেব্রুয়ারি মাসের বিল' },
            { id: 'TXN004', student: 'তাহমিদ হাসান', class: 'অষ্টম', amount: 2000, date: '০৭ মার্চ, ২০২৬', status: 'PENDING', type: 'INCOME', category: 'বইয়ের দাম' },
        ];

        return NextResponse.json({
            summary,
            transactions: recentTransactions
        });
    } catch (error) {
        console.error('Accounts API Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
