// Development-only dashboard summary with sample data
export const dashboardSummaryDev = async () => {
    // Always return sample data for development/testing
    // weeklyRevenue is with lable day name and value for each day of the week
    return {
        totalJobs: 120,
        todayJobs: 8,
        activeTechnicians: 15,
        todayRevenue: 3500.75,
        weeklyRevenue: [
            { day: 'Mon', value: 5000 },
            { day: 'Tue', value: 7000 },
            { day: 'Wed', value: 4500 },
            { day: 'Thu', value: 6000 },
            { day: 'Fri', value: 8000 },
            { day: 'Sat', value: 5500 },
            { day: 'Sun', value: 9000 },
        ],
    };
};
import { PrismaClient, Admin, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface RegisterInput {
    name: string;
    email: string;
    mobile: string;
    password: string;
    role?: Role;
}

interface LoginInput {
    email: string;
    password: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const register = async (data: RegisterInput): Promise<Omit<Admin, 'password'>> => {
    const { name, email, mobile, password, role } = data;
    const existing = await prisma.admin.findFirst({
        where: { OR: [{ email }, { mobile }] },
    });
    if (existing) throw { status: 409, message: 'Email or mobile already exists' };
    const hashed = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({
        data: {
            name,
            email,
            mobile,
            password: hashed,
            role: role || 'ADMIN',
        },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...adminSafe } = admin;
    return adminSafe;
};

export const login = async (data: LoginInput): Promise<{ token: string; admin: Omit<Admin, 'password'> }> => {
    const { email, password } = data;
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) throw { status: 401, message: 'Invalid credentials' };
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) throw { status: 401, message: 'Invalid credentials' };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...adminSafe } = admin;
    console.log("admin:", admin);

    const token = jwt.sign({ id: admin.id, role: admin.role }, JWT_SECRET, { expiresIn: '7d' });
    return { token, admin: adminSafe };
};

export const dashboardSummary = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);

    // Run all independent queries in parallel
    const [
        totalJobs,
        todayJobs,
        activeTechnicians,
        todayRevenueAgg,
        weeklyRevenueRaw,
        spareStockData,
        lowStockCount,
        todaySpareUsage,
        companyEarningsAgg,
        pendingPayoutsAgg,
        walletBalancesAgg,
        recentJobs,
    ] = await Promise.all([
        prisma.job.count(),
        prisma.job.count({ where: { createdAt: { gte: today } } }),
        prisma.technician.count({ where: { isActive: true } }),
        prisma.job.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: today } } }),
        prisma.job.groupBy({
            by: ['createdAt'],
            _sum: { totalAmount: true },
            where: { createdAt: { gte: weekAgo, lte: today } },
            orderBy: { createdAt: 'asc' },
        }),
        prisma.spare.findMany({
            where: { isActive: true },
            select: { costPrice: true, stockQty: true },
        }),
        prisma.spare.count({
            where: { stockQty: { lte: prisma.spare.fields.minStock }, isActive: true },
        }),
        prisma.spareUsage.aggregate({
            _sum: { totalPrice: true },
            where: { createdAt: { gte: today } },
        }),
        prisma.job.aggregate({ _sum: { companyShare: true }, where: { status: 'COMPLETED' } }),
        prisma.payout.aggregate({ _sum: { amount: true }, where: { status: { in: ['PENDING', 'APPROVED'] } } }),
        prisma.wallet.aggregate({ _sum: { balance: true } }),
        prisma.job.findMany({
            where: { isDeleted: false },
            orderBy: { updatedAt: 'desc' },
            take: 10,
            select: {
                id: true,
                jobCode: true,
                customerName: true,
                status: true,
                totalAmount: true,
                updatedAt: true,
                category: { select: { name: true } },
                technician: { select: { name: true } },
            },
        }),
    ]);

    // Process weekly revenue
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyRevenue: { day: string; value: number }[] = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekAgo);
        d.setDate(weekAgo.getDate() + i);
        return { day: dayNames[d.getDay()], value: 0 };
    });
    for (const entry of weeklyRevenueRaw) {
        const day = new Date(entry.createdAt);
        day.setHours(0, 0, 0, 0);
        const diff = Math.floor((day.getTime() - weekAgo.getTime()) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff < 7) {
            weeklyRevenue[diff].value += Number(entry._sum.totalAmount) || 0;
        }
    }

    return {
        totalJobs,
        todayJobs,
        activeTechnicians,
        todayRevenue: todayRevenueAgg._sum.totalAmount || 0,
        weeklyRevenue,
        totalSpareStockValue: spareStockData.reduce((sum, s) => sum + (s.costPrice * s.stockQty), 0),
        lowStockCount,
        todaySpareUsageValue: todaySpareUsage._sum.totalPrice || 0,
        companyEarnings: companyEarningsAgg._sum.companyShare || 0,
        pendingPayouts: pendingPayoutsAgg._sum.amount || 0,
        totalWalletBalance: walletBalancesAgg._sum.balance || 0,
        recentJobs,
    };
};