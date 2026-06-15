import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { JobStatus, Prisma } from '@prisma/client';
import { emitToAllAdmins } from '../socket/socket.server';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

interface BookServiceDto {
    categoryId: number;
    description: string;
    preferredTime: string; // ISO string
    latitude: number;
    longitude: number;
    address: string;
}

export class CustomerService {

    private isMissingJobScopeTable(error: unknown): boolean {
        const e = error as Prisma.PrismaClientKnownRequestError;
        const table = e?.meta?.table;
        return e?.code === 'P2021' && typeof table === 'string' && table.toLowerCase() === 'jobscope';
    }

    private readonly trackingActiveStatuses: JobStatus[] = [
        JobStatus.CREATED,
        JobStatus.ASSIGNED,
        JobStatus.ACCEPTED,
        JobStatus.IN_PROGRESS,
        JobStatus.WAITING_APPROVAL,
        JobStatus.WAITING_OTP,
    ];

    private buildTrackingTimeline(job: any) {
        const statusOrder: JobStatus[] = [
            JobStatus.CREATED,
            JobStatus.ASSIGNED,
            JobStatus.ACCEPTED,
            JobStatus.IN_PROGRESS,
            JobStatus.WAITING_OTP,
            JobStatus.COMPLETED,
        ];

        const currentIndex = statusOrder.indexOf(job.status as JobStatus);

        const pointState = (index: number) => {
            if (currentIndex < 0) return index === 0 ? 'CURRENT' : 'PENDING';
            if (index < currentIndex) return 'DONE';
            if (index === currentIndex) return 'CURRENT';
            return 'PENDING';
        };

        return [
            {
                title: 'Booking Received',
                status: pointState(0),
                time: job.createdAt,
            },
            {
                title: 'Technician Assigned',
                status: pointState(1),
                time: job.technicianId ? job.updatedAt : null,
            },
            {
                title: 'On The Way',
                status: pointState(2),
                time: job.status === JobStatus.ACCEPTED || currentIndex > 2 ? job.updatedAt : null,
            },
            {
                title: 'Work In Progress',
                status: pointState(3),
                time: job.jobStartTime || null,
            },
            {
                title: 'Waiting OTP',
                status: pointState(4),
                time: job.status === JobStatus.WAITING_OTP || currentIndex > 4 ? job.updatedAt : null,
            },
            {
                title: 'Completed',
                status: pointState(5),
                time: job.jobEndTime || null,
            },
        ];
    }

    async sendOtp(mobile: string): Promise<{ otp: string }> {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Find or create customer by mobile
        await prisma.customer.upsert({
            where: { mobile },
            update: { otpCode: otp, otpExpiry },
            create: { mobile, otpCode: otp, otpExpiry },
        });

        // In real app, send OTP via SMS; in dev, return in response
        return { otp };
    }

    async verifyOtp(mobile: string, otp: string): Promise<{ token: string; customer: any }> {
        const customer = await prisma.customer.findUnique({ where: { mobile } });

        if (!customer) {
            throw new Error('Customer not found');
        }

        if (customer.otpCode !== otp) {
            throw new Error('Invalid OTP');
        }

        if (!customer.otpExpiry || customer.otpExpiry < new Date()) {
            throw new Error('OTP has expired');
        }

        // Clear OTP fields
        const updatedCustomer = await prisma.customer.update({
            where: { id: customer.id },
            data: { otpCode: null, otpExpiry: null },
        });

        // Generate JWT
        const token = jwt.sign(
            { id: customer.id, role: 'CUSTOMER' },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return { token, customer: updatedCustomer };
    }

    async getCategories(): Promise<any[]> {
        return prisma.category.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }

    async bookService(customerId: number, data: BookServiceDto): Promise<any> {
        const { categoryId, description, preferredTime, latitude, longitude, address } = data;

        if (!categoryId || !description || !preferredTime || latitude === undefined || longitude === undefined || !address) {
            throw new Error('Missing required fields: categoryId, description, preferredTime, latitude, longitude, address');
        }

        // Fetch customer details
        const customer = await prisma.customer.findUnique({ where: { id: customerId } });
        if (!customer) {
            throw new Error('Customer not found');
        }

        // Generate unique job code
        const jobCode = 'OHM' + Date.now().toString().slice(-6);

        // Create job
        const job = await prisma.job.create({
            data: {
                jobCode,
                customerName: customer.name || customer.mobile,
                customerPhone: customer.mobile,
                address,
                latitude,
                longitude,
                description,
                categoryId,
                customerId,
                status: 'CREATED',
                scheduleTime: new Date(preferredTime),
            },
            include: { category: true },
        });

        // Emit socket event to admins
        emitToAllAdmins('new_job_request', {
            jobId: job.id,
            jobCode: job.jobCode,
            customerName: job.customerName,
            customerPhone: job.customerPhone,
            address: job.address,
            latitude: job.latitude,
            longitude: job.longitude,
            description: job.description,
            category: job.category?.name,
            scheduleTime: job.scheduleTime,
            createdAt: job.createdAt,
        });

        return job;
    }

    async getMyJobs(customerId: number): Promise<any[]> {
        return prisma.job.findMany({
            where: { customerId, isDeleted: false },
            include: {
                category: true,
                technician: { select: { id: true, name: true, rating: true } },
                payments: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getJobById(customerId: number, jobId: number): Promise<any | null> {
        try {
            return await prisma.job.findFirst({
                where: { id: jobId, customerId, isDeleted: false },
                include: {
                    category: true,
                    technician: { select: { id: true, name: true, rating: true, mobile: true } },
                    payments: true,
                    jobScopes: { include: { scope: true } },
                },
            });
        } catch (error) {
            if (!this.isMissingJobScopeTable(error)) {
                throw error;
            }

            return prisma.job.findFirst({
                where: { id: jobId, customerId, isDeleted: false },
                include: {
                    category: true,
                    technician: { select: { id: true, name: true, rating: true, mobile: true } },
                    payments: true,
                },
            });
        }
    }

    async getActiveJob(customerId: number): Promise<any[]> {
        const jobs = await prisma.job.findMany({
            where: {
                customerId,
                isDeleted: false,
                status: { in: this.trackingActiveStatuses },
            },
            include: {
                category: { select: { name: true } },
                technician: { select: { id: true, name: true, rating: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return jobs.map((job) => ({
            id: job.id,
            jobCode: job.jobCode,
            serviceName: job.category?.name || 'Service',
            categoryName: job.category?.name || 'Service',
            status: job.status,
            scheduleTime: job.scheduleTime,
            address: job.address || 'Address not available',
            technician: job.technician
                ? {
                    id: job.technician.id,
                    name: job.technician.name,
                    rating: job.technician.rating,
                }
                : null,
        }));
    }

    async getTrackingJobs(customerId: number): Promise<any[]> {
        const jobs = await prisma.job.findMany({
            where: {
                customerId,
                isDeleted: false,
                status: { in: this.trackingActiveStatuses },
            },
            include: {
                category: { select: { name: true } },
                technician: { select: { id: true, name: true, rating: true } },
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { status: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return jobs.map((job) => ({
            id: job.id,
            jobCode: job.jobCode,
            categoryName: job.category?.name || 'Service',
            status: job.status,
            scheduledTime: job.scheduleTime,
            address: job.address || 'Address not available',
            technician: job.technician
                ? {
                    id: job.technician.id,
                    name: job.technician.name,
                    rating: job.technician.rating,
                }
                : null,
            amount: job.totalAmount ?? null,
            paymentStatus: job.payments[0]?.status || 'PENDING',
        }));
    }

    async getTrackingJobDetail(customerId: number, jobId: number): Promise<any> {
        let job: any;
        try {
            job = await prisma.job.findUnique({
                where: { id: jobId },
                include: {
                    category: { select: { name: true } },
                    technician: { select: { id: true, name: true, rating: true } },
                    payments: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { amount: true, status: true, method: true },
                    },
                    jobScopes: {
                        include: {
                            scope: { select: { name: true } },
                        },
                    },
                },
            });
        } catch (error) {
            if (!this.isMissingJobScopeTable(error)) {
                throw error;
            }

            job = await prisma.job.findUnique({
                where: { id: jobId },
                include: {
                    category: { select: { name: true } },
                    technician: { select: { id: true, name: true, rating: true } },
                    payments: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { amount: true, status: true, method: true },
                    },
                },
            });
        }

        if (!job || job.isDeleted) {
            throw new Error('Job not found');
        }

        if (job.customerId !== customerId) {
            throw new Error('FORBIDDEN_JOB_ACCESS');
        }

        const payment = job.payments[0] || null;
        const durationMinutes =
            job.jobStartTime && job.jobEndTime
                ? Math.max(
                    1,
                    Math.round(
                        (new Date(job.jobEndTime).getTime() -
                            new Date(job.jobStartTime).getTime()) /
                        60000
                    )
                )
                : null;

        return {
            id: job.id,
            jobCode: job.jobCode,
            categoryName: job.category?.name || 'Service',
            scopeOfWork: job.jobScopes?.map((s: any) => s.scope?.name).filter(Boolean) || [],
            status: job.status,
            scheduledTime: job.scheduleTime,
            startTime: job.jobStartTime,
            endTime: job.jobEndTime,
            durationMinutes,
            address: job.address || 'Address not available',
            latitude: job.latitude,
            longitude: job.longitude,
            description: job.description || 'No description',
            technician: job.technician
                ? {
                    id: job.technician.id,
                    name: job.technician.name,
                    rating: job.technician.rating,
                }
                : null,
            payment: {
                amount: payment?.amount ?? job.totalAmount ?? null,
                status: payment?.status || 'PENDING',
                method: payment?.method || null,
            },
            timeline: this.buildTrackingTimeline(job),
        };
    }

    async getTrackingHistory(customerId: number): Promise<any[]> {
        const jobs = await prisma.job.findMany({
            where: {
                customerId,
                isDeleted: false,
                status: { in: [JobStatus.COMPLETED, JobStatus.CLOSED, JobStatus.REJECTED] },
            },
            include: {
                category: { select: { name: true } },
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { amount: true, status: true, method: true },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        return jobs.map((job) => ({
            id: job.id,
            jobCode: job.jobCode,
            categoryName: job.category?.name || 'Service',
            status: job.status === JobStatus.CLOSED ? 'CANCELLED' : job.status,
            scheduledTime: job.scheduleTime,
            address: job.address || 'Address not available',
            amount: job.totalAmount ?? null,
            paymentStatus: job.payments[0]?.status || 'PENDING',
        }));
    }

    async getHistory(
        customerId: number,
        page: number,
        limit: number,
        status?: string,
        search?: string,
    ): Promise<{ total: number; page: number; jobs: any[] }> {
        const validStatuses = ['COMPLETED', 'CANCELLED', 'REJECTED'];
        const normalizedStatus = status?.trim().toUpperCase();

        // Treat null-like values as "no filter" so all statuses are returned.
        const shouldApplyStatusFilter = !!normalizedStatus
            && !['ALL', 'NULL', 'UNDEFINED'].includes(normalizedStatus)
            && validStatuses.includes(normalizedStatus);

        // Map CANCELLED -> CLOSED in DB terms when a specific status filter is requested.
        const dbStatuses: JobStatus[] | undefined = shouldApplyStatusFilter
            ? (normalizedStatus === 'CANCELLED' ? [JobStatus.CLOSED] : [normalizedStatus as JobStatus])
            : undefined;

        const searchFilter = search?.trim()
            ? {
                OR: [
                    { jobCode: { contains: search.trim(), mode: 'insensitive' as const } },
                    { address: { contains: search.trim(), mode: 'insensitive' as const } },
                    { category: { name: { contains: search.trim(), mode: 'insensitive' as const } } },
                ],
            }
            : {};

        const where: Prisma.JobWhereInput = {
            customerId,
            isDeleted: false,
            ...(dbStatuses ? { status: { in: dbStatuses } } : {}),
            ...searchFilter,
        };

        const baseInclude = {
            category: { select: { name: true } },
            technician: { select: { name: true } },
            payments: {
                orderBy: { createdAt: 'desc' } as const,
                take: 1,
                select: { amount: true, status: true, method: true },
            },
        };

        let jobs: any[];
        let total: number;
        let scopesAvailable = true;

        try {
            [total, jobs] = await Promise.all([
                prisma.job.count({ where }),
                prisma.job.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                    include: {
                        ...baseInclude,
                        jobScopes: { include: { scope: { select: { name: true } } } },
                    },
                }),
            ]);
        } catch (err) {
            if (this.isMissingJobScopeTable(err)) {
                scopesAvailable = false;
                [total, jobs] = await Promise.all([
                    prisma.job.count({ where }),
                    prisma.job.findMany({
                        where,
                        orderBy: { createdAt: 'desc' },
                        skip: (page - 1) * limit,
                        take: limit,
                        include: baseInclude,
                    }),
                ]);
            } else {
                throw err;
            }
        }

        const mapped = jobs.map((job) => ({
            id: job.id,
            jobCode: job.jobCode,
            categoryName: job.category?.name ?? 'Service',
            scopeOfWork: scopesAvailable && job.jobScopes
                ? job.jobScopes.map((js: any) => js.scope?.name).filter(Boolean)
                : [],
            status: job.status === JobStatus.CLOSED ? 'CANCELLED' : (job.status as string),
            amount: job.totalAmount ?? null,
            paymentStatus: job.payments[0]?.status ?? null,
            paymentMethod: job.payments[0]?.method ?? job.paymentMethod ?? null,
            technician: job.technician ? { name: job.technician.name } : null,
            address: job.address ?? null,
            createdAt: job.createdAt,
            completedAt: job.jobEndTime ?? null,
            beforeImage: job.beforeImage ?? null,
            afterImage: job.afterImage ?? null,
            duration: job.duration ?? null,
        }));

        return { total, page, jobs: mapped };
    }

    async getPaymentInfo(customerId: number, jobId: number): Promise<{ job: any; companySettings: any }> {
        const job = await prisma.job.findFirst({
            where: { id: jobId, customerId, isDeleted: false },
            select: { id: true, totalAmount: true, status: true, paymentMethod: true },
        });

        if (!job) {
            throw new Error('Job not found');
        }

        const companySettings = await prisma.companyPaymentSettings.findFirst();

        return { job, companySettings };
    }

    async submitPaymentChoice(customerId: number, jobId: number, method: 'CASH' | 'ONLINE'): Promise<any> {
        const job = await prisma.job.findFirst({
            where: { id: jobId, customerId, isDeleted: false },
        });

        if (!job) {
            throw new Error('Job not found');
        }

        if (job.status !== 'COMPLETED') {
            throw new Error('Payment can only be submitted for completed jobs');
        }

        // Update job with payment method
        const updatedJob = await prisma.job.update({
            where: { id: jobId },
            data: { paymentMethod: method },
        });

        // If CASH, create a Payment record
        if (method === 'CASH') {
            await prisma.payment.create({
                data: {
                    jobId,
                    amount: job.totalAmount || 0,
                    method: 'CASH',
                    status: 'PENDING',
                },
            });
        }

        // Emit to admins
        emitToAllAdmins('payment_submitted', {
            jobId,
            method,
            customerId,
        });

        return updatedJob;
    }
}

export const customerService = new CustomerService();
