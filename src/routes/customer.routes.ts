import { Router } from 'express';
import { authenticateCustomerJWT } from '../middleware/customer.middleware';
import { uploadJobImage } from '../config/multer.config';
import * as customerController from '../controllers/customer.controller';

const router = Router();

// Public routes
router.post('/auth/send-otp', customerController.sendOtp);
router.post('/auth/verify-otp', customerController.verifyOtp);
router.get('/categories', customerController.getCategories);

// Protected routes
router.post('/book-service', authenticateCustomerJWT, uploadJobImage.single('image'), customerController.bookService);
router.get('/jobs', authenticateCustomerJWT, customerController.getMyJobs);
router.get('/active-job', authenticateCustomerJWT, customerController.getActiveJob);
router.get('/jobs/:id', authenticateCustomerJWT, customerController.getJobById);
router.get('/jobs/:id/payment', authenticateCustomerJWT, customerController.getPaymentInfo);
router.post('/jobs/:id/payment', authenticateCustomerJWT, customerController.submitPaymentChoice);
router.get('/tracking/jobs', authenticateCustomerJWT, customerController.getTrackingJobs);
router.get('/tracking/job/:jobId', authenticateCustomerJWT, customerController.getTrackingJobDetail);
router.get('/tracking/history', authenticateCustomerJWT, customerController.getTrackingHistory);
router.get('/history', authenticateCustomerJWT, customerController.getHistory);

export default router;
