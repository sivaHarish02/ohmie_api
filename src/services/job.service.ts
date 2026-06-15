import prisma from '../utils/prisma';
import { JobStatus } from '@prisma/client';

interface JobInput {
    customerName: string;
    customerPhone: string;
    address: string;
    description?: string;
    categoryId: number;
    technicianId?: number;
    scheduleTime: Date;
    totalAmount?: number;
    technicianShare?: number;
    companyShare?: number;
}

const generateJobCode = (): string => {
    const now = new Date();
    const y = now.getFullYear().toString().slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `JOB-${y}${m}${d}-${rand}`;
};

export const createJob = async (data: JobInput) => {
    const { customerName, customerPhone, address, description, categoryId, technicianId, scheduleTime, totalAmount = 0, technicianShare = 0, companyShare = 0 } = data;

    const jobCode = generateJobCode();

    return prisma.job.create({
        data: {
            jobCode,
            customerName,
            customerPhone,
            address,
            description: description || '',
            categoryId,
            ...(technicianId ? { technicianId, status: 'ASSIGNED' as JobStatus } : {}),
            scheduleTime: new Date(scheduleTime),
            totalAmount,
            technicianShare,
            companyShare,
        },
        include: {
            category: true,
            technician: true,
        },
    });
};

export const listJobs = async (query: any) => {

    const { status, search, technicianId, categoryId } = query;

    const jobs = await prisma.job.findMany({
        where: {
            isDeleted: false,
            ...(status ? { status: status as JobStatus } : {}),
            ...(technicianId ? { technicianId: Number(technicianId) } : {}),
            ...(categoryId ? { categoryId: Number(categoryId) } : {}),
            ...(search
                ? {
                    OR: [
                        { customerName: { contains: search } },
                        { jobCode: { contains: search } },
                        { customerPhone: { contains: search } },
                    ],
                }
                : {}),
        },
        include: {
            category: true,
            technician: true,
        },
        orderBy: { createdAt: 'desc' },
    });
    return jobs;
};



export const assignTechnician = async (jobId: number, technicianId: number) => {
    const job = await prisma.job.findUnique({ where: { id: jobId }, include: { category: true } });
    if (!job) throw { status: 404, message: 'Job not found' };

    // Control rules: cannot assign if already in progress or beyond
    const blockedStatuses: string[] = ['IN_PROGRESS', 'WAITING_APPROVAL', 'WAITING_OTP', 'COMPLETED', 'CLOSED'];
    if (blockedStatuses.includes(job.status)) {
        throw { status: 400, message: `Cannot assign technician when job is ${job.status}` };
    }

    // const technician = await prisma.technician.findFirst({
    //     where: {
    //         id: technicianId,
    //         categories: {
    //             some: { categoryId: job.categoryId },
    //         },
    //     },
    // });
    // if (!technician) throw { status: 400, message: 'Technician does not match job category or does not exist' };

    return prisma.job.update({
        where: { id: jobId },
        data: {
            technicianId,
            status: 'ASSIGNED',
            rejectReason: null,
            rejectedAt: null,
        },
        include: {
            category: true,
            technician: true,
        },
    });
};

export const updateJob = async (id: number, data: any) => {
    // Only allow certain fields to be updated
    const allowedFields = [
        'customerName', 'customerPhone', 'address', 'description', 'categoryId', 'scheduleTime', 'status', 'totalAmount', 'technicianShare', 'companyShare', 'technicianId', 'isDeleted'
    ];
    const updateData: any = {};
    for (const key of allowedFields) {
        if (data[key] !== undefined) updateData[key] = data[key];
    }
    return prisma.job.update({
        where: { id },
        data: updateData,
        include: { category: true, technician: true },
    });
};

export const deleteJob = async (id: number) => {
    // Soft delete: set isDeleted = true
    return prisma.job.update({
        where: { id },
        data: { isDeleted: true as any },
    });
};
