import { Server, Socket } from 'socket.io';
import { emitToTechnician, emitToAllAdmins, emitToCustomer } from './socket.server';

export const handleSocketEvents = (io: Server, socket: Socket, userId: number, role: string) => {

    // --- Technician events ---
    if (role === 'TECHNICIAN') {
        // Technician sends location update
        socket.on('location_update', (data: { lat: number; lng: number }) => {
            emitToAllAdmins('location_update', {
                technicianId: userId,
                ...data,
                timestamp: new Date().toISOString(),
            });
        });
    }

    // --- Common: ping/pong for connection health ---
    socket.on('ping_server', () => {
        socket.emit('pong_server', { timestamp: Date.now() });
    });
};

// --- Event emission functions used by controllers ---

export const emitJobAssigned = (technicianId: number, job: any) => {
    emitToTechnician(technicianId, 'job_assigned', {
        jobId: job.id,
        jobCode: job.jobCode,
        customerName: job.customerName,
        address: job.address,
        scheduleTime: job.scheduleTime,
        category: job.category?.name,
    });
};

export const emitJobStatusUpdate = (job: any) => {
    // Notify all admins about job status change
    emitToAllAdmins('job_status_update', {
        jobId: job.id,
        jobCode: job.jobCode,
        status: job.status,
        technicianId: job.technicianId,
    });

    // Also notify the technician
    if (job.technicianId) {
        emitToTechnician(job.technicianId, 'job_updated', {
            jobId: job.id,
            jobCode: job.jobCode,
            status: job.status,
        });
    }

    // Also notify the customer
    if (job.customerId) {
        emitToCustomer(job.customerId, 'job_updated', {
            jobId: job.id,
            jobCode: job.jobCode,
            status: job.status,
        });
    }
};

export const emitJobAssignedToCustomer = (job: any) => {
    if (job.customerId) {
        emitToCustomer(job.customerId, 'job_assigned', {
            jobId: job.id,
            jobCode: job.jobCode,
            status: job.status,
            technicianId: job.technicianId,
        });
    }
};

export const emitSpareRequested = (technicianId: number, data: any) => {
    emitToAllAdmins('spare_requested', {
        technicianId,
        ...data,
    });
};

export const emitSpareRequestUpdate = (technicianId: number, data: any) => {
    emitToTechnician(technicianId, 'spare_request_update', data);
};

export const emitPaymentUpdate = (technicianId: number | null, data: any) => {
    emitToAllAdmins('payment_update', data);
    if (technicianId) {
        emitToTechnician(technicianId, 'payment_update', data);
    }
    if (data?.customerId) {
        emitToCustomer(data.customerId, 'payment_updated', data);
        emitToCustomer(data.customerId, 'payment_update', data);
    }
};

export const emitOtpSent = (technicianId: number, data: any) => {
    emitToTechnician(technicianId, 'otp_sent', data);
};

export const emitJobRejected = (job: any, technicianId: number, reason: string) => {
    emitToAllAdmins('job_rejected', {
        jobId: job.id,
        jobCode: job.jobCode,
        technicianId,
        reason,
        rejectedAt: new Date().toISOString(),
        customerName: job.customerName,
    });
};

export const emitJobStarted = (job: any) => {
    emitToAllAdmins('job_started', {
        jobId: job.id,
        jobCode: job.jobCode,
        status: job.status,
        technicianId: job.technicianId,
        jobStartTime: job.jobStartTime,
    });

    if (job.customerId) {
        emitToCustomer(job.customerId, 'job_started', {
            jobId: job.id,
            status: job.status,
        });
    }
};

export const emitJobCompleted = (job: any) => {
    emitToAllAdmins('job_completed', {
        jobId: job.id,
        jobCode: job.jobCode,
        status: job.status,
        technicianId: job.technicianId,
        totalAmount: job.totalAmount,
        duration: job.duration,
    });

    if (job.customerId) {
        emitToCustomer(job.customerId, 'job_completed', {
            jobId: job.id,
            status: job.status,
        });
    }
};
