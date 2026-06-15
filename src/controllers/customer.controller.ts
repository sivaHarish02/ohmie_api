import { Request, Response } from 'express';
import { customerService } from '../services/customer.service';
import { CustomerAuthRequest } from '../middleware/customer.middleware';
import { log } from 'node:console';

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { mobile } = req.body;
        if (!mobile) {
            res.status(400).json({ success: false, message: 'Mobile number is required' });
            return;
        }
        const data = await customerService.sendOtp(mobile);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.log("Error sending OTP:", error);

        res.status(500).json({ success: false, message: error.message || 'Failed to send OTP' });
    }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { mobile, otp } = req.body;
        if (!mobile || !otp) {
            res.status(400).json({ success: false, message: 'Mobile and OTP are required' });
            return;
        }
        const data = await customerService.verifyOtp(mobile, otp);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        const statusCode = error.message === 'Customer not found' ? 404
            : error.message === 'Invalid OTP' || error.message === 'OTP has expired' ? 401
                : 500;
        console.log("Error verifying OTP:", error);
        res.status(statusCode).json({ success: false, message: error.message || 'OTP verification failed' });
    }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await customerService.getCategories();
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.log("Error fetching categories:", error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch categories' });
    }
};

export const bookService = async (req: CustomerAuthRequest, res: Response): Promise<void> => {
    try {
        const customerId = req.customer!.id;
        const data = await customerService.bookService(customerId, req.body);
        res.status(201).json({ success: true, data });
    } catch (error: any) {
        const statusCode = error.message.includes('Missing required') ? 400 : 500;
        console.log("Error booking service:", error);
        res.status(statusCode).json({ success: false, message: error.message || 'Failed to book service' });
    }
};

export const getMyJobs = async (req: CustomerAuthRequest, res: Response): Promise<void> => {
    try {
        const customerId = req.customer!.id;
        const data = await customerService.getMyJobs(customerId);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.log("Error fetching jobs:", error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch jobs' });
    }
};

export const getJobById = async (req: CustomerAuthRequest, res: Response): Promise<void> => {
    try {
        const customerId = req.customer!.id;
        const jobId = parseInt(req.params.id, 10);
        if (isNaN(jobId)) {
            res.status(400).json({ success: false, message: 'Invalid job ID' });
            return;
        }
        const data = await customerService.getJobById(customerId, jobId);
        if (!data) {
            res.status(404).json({ success: false, message: 'Job not found' });
            return;
        }
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.log("Error fetching job by ID:", error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch job' });
    }
};

export const getActiveJob = async (req: CustomerAuthRequest, res: Response): Promise<void> => {
    try {
        const customerId = req.customer!.id;
        const jobs = await customerService.getActiveJob(customerId);
        res.status(200).json({
            success: true,
            jobs,
            activeBooking: jobs,
            data: jobs,
        });
    } catch (error: any) {
        console.log("Error fetching active job:", error);

        res.status(500).json({ success: false, message: error.message || 'Failed to fetch active job' });
    }
};

export const getPaymentInfo = async (req: CustomerAuthRequest, res: Response): Promise<void> => {
    try {
        const customerId = req.customer!.id;
        const jobId = parseInt(req.params.id, 10);
        if (isNaN(jobId)) {
            res.status(400).json({ success: false, message: 'Invalid job ID' });
            return;
        }
        const data = await customerService.getPaymentInfo(customerId, jobId);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.log("Error fetching payment info:", error);
        const statusCode = error.message === 'Job not found' ? 404 : 500;
        res.status(statusCode).json({ success: false, message: error.message || 'Failed to fetch payment info' });
    }
};

export const submitPaymentChoice = async (req: CustomerAuthRequest, res: Response): Promise<void> => {
    try {
        const customerId = req.customer!.id;
        const jobId = parseInt(req.params.id, 10);
        if (isNaN(jobId)) {
            res.status(400).json({ success: false, message: 'Invalid job ID' });
            return;
        }
        const { method } = req.body;
        if (!method || !['CASH', 'ONLINE'].includes(method)) {
            res.status(400).json({ success: false, message: 'Payment method must be CASH or ONLINE' });
            return;
        }
        const data = await customerService.submitPaymentChoice(customerId, jobId, method);
        res.status(200).json({ success: true, data });
    } catch (error: any) {
        console.log("Error submitting payment choice:", error);

        const statusCode = error.message === 'Job not found' ? 404
            : error.message.includes('only be submitted') ? 400
                : 500;
        res.status(statusCode).json({ success: false, message: error.message || 'Failed to submit payment choice' });
    }
};

export const getTrackingJobs = async (req: CustomerAuthRequest, res: Response): Promise<void> => {
    try {
        const customerId = req.customer!.id;
        const jobs = await customerService.getTrackingJobs(customerId);
        res.status(200).json({ success: true, jobs });
    } catch (error: any) {
        console.log("Error fetching tracking jobs:", error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch tracking jobs' });
    }
};

export const getTrackingJobDetail = async (req: CustomerAuthRequest, res: Response): Promise<void> => {
    try {
        const customerId = req.customer!.id;
        const jobId = parseInt(req.params.jobId, 10);

        if (isNaN(jobId)) {
            res.status(400).json({ success: false, message: 'Invalid job ID' });
            return;
        }

        const job = await customerService.getTrackingJobDetail(customerId, jobId);
        res.status(200).json({ success: true, job });
    } catch (error: any) {
        console.log("Error fetching tracking job detail:", error);
        if (error.message === 'FORBIDDEN_JOB_ACCESS') {
            res.status(403).json({ success: false, message: 'You are not allowed to access this job' });
            return;
        }
        if (error.message === 'Job not found') {
            res.status(404).json({ success: false, message: 'Job not found' });
            return;
        }
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch tracking job detail' });
    }
};

export const getTrackingHistory = async (req: CustomerAuthRequest, res: Response): Promise<void> => {
    try {
        const customerId = req.customer!.id;
        const jobs = await customerService.getTrackingHistory(customerId);
        res.status(200).json({ success: true, jobs });
    } catch (error: any) {
        console.log("Error fetching tracking history:", error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch tracking history' });
    }
};

export const getHistory = async (req: CustomerAuthRequest, res: Response): Promise<void> => {
    try {
        log("Received request for history with query:", req.query);
        const customerId = req.customer!.id;
        console.log("customerId:", customerId);

        const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
        const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '10', 10)));
        const status = req.query.status as string | undefined;
        const search = req.query.search as string | undefined;
        const data = await customerService.getHistory(customerId, page, limit, status, search);
        res.status(200).json({ success: true, ...data });
    } catch (error: any) {
        console.log('Error fetching history:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch history' });
    }
};
