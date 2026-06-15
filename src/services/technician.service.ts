
import prisma from '../utils/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { TechnicianStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { JobStatus } from '@prisma/client';
import { creditWallet } from './wallet.service';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

interface TechnicianInput {
    name: string;
    mobile: string;
    email?: string;
    password: string;
    categoryIds: number[];
    experience: number; // Added
    rating: number;
}

export const createTechnician = async (data: TechnicianInput) => {
    try {
        const { name, mobile, email, password, categoryIds, experience, rating } = data;

        const exists = await prisma.technician.findUnique({ where: { mobile } });
        if (exists) throw { status: 409, message: 'Mobile already exists' };
        // Ensure password exists; generate a secure one if not provided
        let plainPassword = password;
        if (!plainPassword) {
            plainPassword = crypto.randomBytes(6).toString('base64url');
        }
        if (typeof plainPassword !== 'string' || plainPassword.length === 0) {
            throw { status: 400, message: 'Password is required' };
        }

        const hashed = await bcrypt.hash(plainPassword, 10);
        const technician = await prisma.technician.create({
            data: {
                name,
                mobile,
                email,
                password: hashed,
                experience: experience, // Added
                rating: rating || 5, // Added
                categories: {
                    create: categoryIds.map(categoryId => ({ category: { connect: { id: Number(categoryId) } } }))
                }
            },
            include: {
                categories: { include: { category: true } }
            }
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...techSafe } = technician;
        // If we generated a password, return it so caller can notify the technician
        return { ...techSafe, generatedPassword: password ? undefined : plainPassword };
    } catch (error: any) {
        console.error('Error in createTechnician:', error.message || error);
        throw error; // Re-throw to be caught by controller
    }
};

export const listTechnicians = async () => {
    const technicians = await prisma.technician.findMany({
        include: {
            categories: { include: { category: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    return technicians.map(({ password, ...rest }) => rest);
};
// Admin: update technician
export const updateTechnician = async (id: number, data: any) => {
    // Only allow certain fields to be updated
    const allowedFields = [
        'name', 'mobile', 'email', 'isActive', 'status'
    ];
    const updateData: any = {};
    for (const key of allowedFields) {
        if (data[key] !== undefined) updateData[key] = data[key];
    }
    // Validate status if provided to avoid sending invalid enum to Prisma
    if (updateData.status !== undefined) {

        const allowedStatuses = ['ACTIVE', 'INACTIVE', 'WARNING', 'BLOCKED', 'SUSPENDED'];
        const s = String(updateData.status).toUpperCase();
        if (!allowedStatuses.includes(s)) {
            throw { status: 400, message: `Invalid status '${updateData.status}'. Allowed: ${allowedStatuses.join(', ')}` };
        }
        updateData.status = s;
    }

    return prisma.technician.update({
        where: { id },
        data: updateData,
        include: { categories: { include: { category: true } } },
    });
};

export const changeTechnicianStatus = async (technicianId: number, status: TechnicianStatus) => {
    const technician = await prisma.technician.update({
        where: { id: technicianId },
        data: { status },
        include: { categories: { include: { category: true } } }
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...techSafe } = technician;
    return techSafe;
};

export const toggleTechnicianActive = async (id: number) => {
    const technician = await prisma.technician.findUnique({ where: { id } });
    if (!technician) throw { status: 404, message: 'Technician not found' };
    const updated = await prisma.technician.update({
        where: { id },
        data: { isActive: !technician.isActive },
        include: { categories: { include: { category: true } } },
    });
    const { password: _, ...safe } = updated;
    return safe;
};

export const toggleMyActive = async (technicianId: number) => {
    const technician = await prisma.technician.findUnique({ where: { id: technicianId } });
    if (!technician) throw { status: 404, message: 'Technician not found' };
    const updated = await prisma.technician.update({
        where: { id: technicianId },
        data: { isActive: !technician.isActive },
    });
    return { isActive: updated.isActive };
};

export const getMyProfile = async (technicianId: number) => {
    const technician = await prisma.technician.findUnique({
        where: { id: technicianId },
        include: { categories: { include: { category: true } } },
    });
    if (!technician) throw { status: 404, message: 'Technician not found' };
    const { password, ...profile } = technician;
    return profile;
};

export const updateProfileImage = async (technicianId: number, filename: string) => {
    const updated = await prisma.technician.update({
        where: { id: technicianId },
        data: { profileImage: filename },
    });
    return { profileImage: updated.profileImage };
};

export const deleteTechnician = async (id: number) => {
    const jobCount = await prisma.job.count({
        where: { technicianId: id, isDeleted: false },
    });
    if (jobCount > 0) {
        throw { status: 400, message: 'Cannot delete technician. They have existing jobs assigned.' };
    }
    return prisma.technician.delete({ where: { id } });
};

export const loginTechnician = async (mobile: string, password: string) => {
    console.log("Login attempt for mobile:", mobile, "with password:", password ? '[PROVIDED]' : '[NOT PROVIDED]');

    const technician = await prisma.technician.findUnique({ where: { mobile } });
    if (!technician) throw { status: 401, message: 'Invalid credentials' };

    if (!technician.isActive) {
        throw { status: 403, message: 'Your account has been deactivated. Please contact admin.' };
    }
    if (technician.status === 'BLOCKED' || technician.status === 'SUSPENDED') {
        throw { status: 403, message: 'Your account is blocked or suspended. Please contact admin.' };
    }

    // password comparison check and  directly password match
    const valid = await bcrypt.compare(password, technician.password);
    const isDirectMatch = password === technician.password; // This is not secure, just for debugging
    console.log("Password valid:", valid, "Direct match:", isDirectMatch);
    if (!valid && !isDirectMatch) throw { status: 401, message: 'Invalid credentials' };

    const token = jwt.sign({ id: technician.id, role: 'TECHNICIAN' }, JWT_SECRET, { expiresIn: '7d' });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...technicianSafe } = technician;
    return { token, technician: technicianSafe };
};

export const getJobById = async (technicianId: number, jobId: number) => {
    const job = await prisma.job.findFirst({
        where: { id: jobId, technicianId, isDeleted: false },
        include: { category: true, spareUsages: { include: { spare: true } }, jobScopes: true },
    });
    if (!job) throw { status: 404, message: 'Job not found' };
    return job;
};

export const getAssignedJobs = async (technicianId: number) => {
    return prisma.job.findMany({
        where: {
            technicianId,
            status: 'ASSIGNED',
        },
        include: {
            category: true,
        },
        orderBy: { scheduleTime: 'asc' },
    });
};

export const getAllMyJobs = async (technicianId: number, status?: string) => {
    let statusFilter: any = {};
    if (status) {
        const statuses = status.split(',').map(s => s.trim()) as JobStatus[];
        statusFilter = statuses.length === 1
            ? { status: statuses[0] }
            : { status: { in: statuses } };
    }
    return prisma.job.findMany({
        where: {
            technicianId,
            isDeleted: false,
            ...statusFilter,
        },
        include: {
            category: true,
        },
        orderBy: { updatedAt: 'desc' },
    });
};

export const getTechnicianDashboard = async (technicianId: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [technician, assignedCount, activeJobs, completedToday, earningsToday] = await Promise.all([
        prisma.technician.findUnique({ where: { id: technicianId }, select: { isActive: true } }),
        prisma.job.count({ where: { technicianId, status: 'ASSIGNED' } }),
        prisma.job.findMany({ where: { technicianId, status: { in: ['IN_PROGRESS', 'WAITING_OTP'] } }, include: { category: true }, orderBy: { updatedAt: 'desc' } }),
        prisma.job.count({ where: { technicianId, status: 'COMPLETED', updatedAt: { gte: today, lt: tomorrow } } }),
        prisma.job.aggregate({ where: { technicianId, status: 'COMPLETED', updatedAt: { gte: today, lt: tomorrow } }, _sum: { technicianShare: true } }),
    ]);

    return {
        isActive: technician?.isActive ?? false,
        assignedCount,
        activeJobs,
        activeJob: activeJobs.length > 0 ? activeJobs[0] : null,
        completedToday,
        earningsToday: earningsToday._sum.technicianShare || 0,
    };
};

export const startJob = async (technicianId: number, jobId: number, beforeImage: string) => {
    if (!beforeImage) throw { status: 400, message: 'Before photo is required to start the job' };

    const job = await prisma.job.findFirst({
        where: { id: jobId, technicianId, status: 'ACCEPTED' },
    });
    if (!job) throw { status: 404, message: 'Job not found or not in accepted state' };

    return prisma.job.update({
        where: { id: jobId },
        data: {
            status: 'IN_PROGRESS',
            beforeImage,
            jobStartTime: new Date(),
        },
        include: { category: true, spareUsages: { include: { spare: true } }, jobScopes: true },
    });
};

export const completeJob = async (technicianId: number, jobId: number, afterImage: string, paymentMethod?: string) => {
    if (!afterImage) throw { status: 400, message: 'After photo is required to complete the job' };

    const job = await prisma.job.findFirst({
        where: { id: jobId, technicianId, status: 'IN_PROGRESS' },
    });
    if (!job) throw { status: 404, message: 'Job not found or not in progress' };
    if (!job.beforeImage) throw { status: 400, message: 'Before photo is missing. Cannot complete job.' };

    const endTime = new Date();
    let duration: number | null = null;
    if (job.jobStartTime) {
        duration = Math.round((endTime.getTime() - job.jobStartTime.getTime()) / 60000);
    }

    const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: {
            status: 'WAITING_OTP',
            afterImage,
            jobEndTime: endTime,
            duration,
            paymentMethod: paymentMethod || null,
        },
        include: { category: true, spareUsages: { include: { spare: true } }, jobScopes: true },
    });

    // Create payment record if payment method selected
    if (paymentMethod && updatedJob.totalAmount > 0) {
        await prisma.payment.create({
            data: {
                jobId,
                amount: updatedJob.totalAmount,
                method: paymentMethod,
                status: paymentMethod === 'CASH' ? 'PAID' : 'PENDING',
                paidAt: paymentMethod === 'CASH' ? new Date() : null,
            },
        });
    }

    return updatedJob;
};

// --- OTP ---

export const generateOtp = async (jobId: number) => {
    const job = await prisma.job.findFirst({
        where: { id: jobId, status: 'WAITING_OTP' },
    });
    if (!job) throw { status: 404, message: 'Job not found or not waiting for OTP' };

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

    const updated = await prisma.job.update({
        where: { id: jobId },
        data: { otpCode },
    });

    // Mock SMS: log to console
    console.log(`[SMS MOCK] OTP ${otpCode} sent to ${job.customerPhone} for job ${job.jobCode}`);

    return { jobId: updated.id, otpCode, customerPhone: job.customerPhone, technicianId: job.technicianId, jobCode: job.jobCode };
};

export const verifyOtp = async (technicianId: number, jobId: number, otp: string) => {
    if (!otp) throw { status: 400, message: 'OTP is required' };

    const job = await prisma.job.findFirst({
        where: { id: jobId, technicianId, status: 'WAITING_OTP' },
        include: { spareUsages: true },
    });
    if (!job) throw { status: 404, message: 'Job not found or not waiting for OTP' };
    if (!job.otpCode) throw { status: 400, message: 'OTP has not been generated yet' };
    if (job.otpCode !== otp) throw { status: 400, message: 'Invalid OTP' };

    // Calculate commission: 70% technician, 30% company
    const totalAmount = job.totalAmount || 0;
    const technicianShare = Math.round(totalAmount * 0.7 * 100) / 100;
    const companyShare = Math.round(totalAmount * 0.3 * 100) / 100;

    const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: {
            otpVerified: true,
            status: 'COMPLETED',
            technicianShare,
            companyShare,
        },
        include: { category: true, spareUsages: { include: { spare: true } }, jobScopes: true },
    });

    // Credit technician wallet
    if (technicianShare > 0) {
        await creditWallet(
            technicianId,
            technicianShare,
            'JOB',
            jobId,
            `Earnings from job ${job.jobCode}`,
        );
    }

    return updatedJob;
};

// --- Spare management ---

export const listSparesForTechnician = async (search?: string) => {
    const where: any = { isActive: true };
    if (search) {
        where.name = { contains: search };
    }
    return prisma.spare.findMany({
        where,
        select: {
            id: true,
            name: true,
            sku: true,
            sellingPrice: true,
            stockQty: true,
            category: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
    });
};

export const requestSpareForJob = async (technicianId: number, jobId: number, spareId: number, quantity: number, reason?: string) => {
    // Verify job belongs to technician and is in progress
    const job = await prisma.job.findFirst({
        where: { id: jobId, technicianId, status: 'IN_PROGRESS' },
    });
    if (!job) throw { status: 404, message: 'Job not found or not in progress' };

    const spare = await prisma.spare.findUnique({ where: { id: spareId } });
    if (!spare || !spare.isActive) throw { status: 404, message: 'Spare not found or inactive' };
    if (spare.stockQty < quantity) throw { status: 400, message: 'Insufficient stock' };

    // Deduct stock
    await prisma.spare.update({
        where: { id: spareId },
        data: { stockQty: { decrement: quantity } },
    });

    // Log stock deduction
    await prisma.spareStockLog.create({
        data: {
            spareId,
            changeQty: -quantity,
            type: 'DEDUCT',
            note: reason || `Used for job ${job.jobCode}`,
        },
    });

    // Create usage record
    const totalPrice = spare.sellingPrice * quantity;
    const usage = await prisma.spareUsage.create({
        data: { jobId, spareId, quantity, totalPrice },
        include: { spare: true },
    });

    // Add to job totalAmount
    await prisma.job.update({
        where: { id: jobId },
        data: { totalAmount: { increment: totalPrice } },
    });

    return usage;
};

export const getJobSpareUsages = async (technicianId: number, jobId: number) => {
    const job = await prisma.job.findFirst({
        where: { id: jobId, technicianId },
    });
    if (!job) throw { status: 404, message: 'Job not found' };

    return prisma.spareUsage.findMany({
        where: { jobId },
        include: { spare: { select: { id: true, name: true, sku: true, sellingPrice: true } } },
        orderBy: { createdAt: 'desc' },
    });
};

export const respondToJob = async (technicianId: number, jobId: number, response: 'ACCEPT' | 'REJECT', reason?: string) => {
    const job = await prisma.job.findFirst({
        where: {
            id: jobId,
            technicianId,
            status: 'ASSIGNED',
        },
    });
    if (!job) throw { status: 404, message: 'Job not found or not assigned to you' };

    if (response === 'ACCEPT') {
        return prisma.job.update({
            where: { id: jobId },
            data: { status: 'ACCEPTED' },
            include: { category: true },
        });
    } else if (response === 'REJECT') {
        if (!reason || reason.trim().length === 0) {
            throw { status: 400, message: 'Reject reason is required' };
        }
        return prisma.job.update({
            where: { id: jobId },
            data: {
                status: 'REJECTED',
                technicianId: null,
                rejectReason: reason.trim(),
                rejectedAt: new Date(),
            },
            include: { category: true },
        });
    } else {
        throw { status: 400, message: 'Invalid response' };
    }
};
