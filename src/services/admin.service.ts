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

    // Total jobs
    const totalJobs = await prisma.job.count();

    // Today jobs
    const todayJobs = await prisma.job.count({
        where: {
            createdAt: {
                gte: today,
            },
        },
    });

    // Active technicians
    const activeTechnicians = await prisma.technician.count({
        where: { isActive: true },
    });

    // Today revenue
    const todayRevenueAgg = await prisma.job.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: today } },
    });
    const todayRevenue = todayRevenueAgg._sum.totalAmount || 0;

    // Weekly revenue (last 7 days, for chart)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyRevenueRaw = await prisma.job.groupBy({
        by: ['createdAt'],
        _sum: { totalAmount: true },
        where: {
            createdAt: {
                gte: weekAgo,
                lte: today,
            },
        },
        orderBy: { createdAt: 'asc' },
    });
    // Build array of { day, value } for last 7 days dynamically
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

    // Total spare stock value
    const spareStockAgg = await prisma.spare.aggregate({
        _sum: { stockQty: true },
    });
    const totalSpareStockValueAgg = await prisma.spare.aggregate({
        _sum: { costPrice: true },
    });
    const totalSpareStockValue = await prisma.spare.findMany({
        where: { isActive: true },
        select: { costPrice: true, stockQty: true },
    });
    const totalSpareStock = totalSpareStockValue.reduce((sum, s) => sum + (s.costPrice * s.stockQty), 0);

    // Low stock count
    const lowStockCount = await prisma.spare.count({
        where: { stockQty: { lte: prisma.spare.fields.minStock }, isActive: true },
    });

    // Today's spare usage value
    const todaySpareUsage = await prisma.spareUsage.aggregate({
        _sum: { totalPrice: true },
        where: { createdAt: { gte: today } },
    });
    const todaySpareUsageValue = todaySpareUsage._sum.totalPrice || 0;

    // Company earnings (sum of companyShare from completed jobs)
    const companyEarningsAgg = await prisma.job.aggregate({
        _sum: { companyShare: true },
        where: { status: 'COMPLETED' },
    });
    const companyEarnings = companyEarningsAgg._sum.companyShare || 0;

    // Total technician payouts pending
    const pendingPayoutsAgg = await prisma.payout.aggregate({
        _sum: { amount: true },
        where: { status: { in: ['PENDING', 'APPROVED'] } },
    });
    const pendingPayouts = pendingPayoutsAgg._sum.amount || 0;

    // Total wallet balances
    const walletBalancesAgg = await prisma.wallet.aggregate({
        _sum: { balance: true },
    });
    const totalWalletBalance = walletBalancesAgg._sum.balance || 0;

    // Pending scope count
    const pendingScopeCount = await prisma.scopeOfWork.count({
        where: { status: 'PENDING' }
    });

    return {
        totalJobs,
        todayJobs,
        activeTechnicians,
        todayRevenue,
        weeklyRevenue,
        totalSpareStockValue: totalSpareStock,
        lowStockCount,
        todaySpareUsageValue,
        companyEarnings,
        pendingPayouts,
        totalWalletBalance,
        pendingScopeCount,
    };
};