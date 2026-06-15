import { Router } from 'express';

import { authenticateJWT, authenticateTechnicianJWT } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import * as technicianController from '../controllers/technician.controller';
import { addScopesToJob } from '../controllers/scopeOfWork.controller';
import { uploadJobImage, uploadProfileImage } from '../config/multer.config';

const router = Router();


router.get('/', authenticateJWT, requireAdmin, technicianController.listTechnicians);
router.post('/', authenticateJWT, requireAdmin, technicianController.createTechnician);
router.put('/:id', authenticateJWT, requireAdmin, technicianController.updateTechnician);
router.patch('/:id/block', authenticateJWT, requireAdmin, technicianController.blockTechnician);
router.patch('/:id/unblock', authenticateJWT, requireAdmin, technicianController.unblockTechnician);
router.patch('/:id/toggle-active', authenticateJWT, requireAdmin, technicianController.toggleTechnicianActive);
router.delete('/:id', authenticateJWT, requireAdmin, technicianController.deleteTechnician);
router.post('/login', technicianController.loginTechnician);
router.get('/job/:id', authenticateTechnicianJWT, technicianController.getJobById);
router.get('/jobs', authenticateTechnicianJWT, technicianController.getAssignedJobs);
router.get('/my-jobs', authenticateTechnicianJWT, technicianController.getAllMyJobs);
router.get('/dashboard', authenticateTechnicianJWT, technicianController.getDashboard);
router.patch('/job/respond', authenticateTechnicianJWT, technicianController.respondToJob);
router.post('/job/:id/start', authenticateTechnicianJWT, uploadJobImage.single('beforeImage'), technicianController.startJob);
router.post('/job/:id/complete', authenticateTechnicianJWT, uploadJobImage.single('afterImage'), technicianController.completeJob);
router.post('/job/verify-otp', authenticateTechnicianJWT, technicianController.verifyOtp);
router.post('/job/:id/send-otp', authenticateJWT, requireAdmin, technicianController.sendOtp);
router.patch('/toggle-my-active', authenticateTechnicianJWT, technicianController.toggleMyActive);
router.get('/me', authenticateTechnicianJWT, technicianController.getMyProfile);
router.post('/me/profile-image', authenticateTechnicianJWT, uploadProfileImage.single('profileImage'), technicianController.uploadProfileImage);
router.get('/spares', authenticateTechnicianJWT, technicianController.listSpares);
router.post('/job/:jobId/request-spare', authenticateTechnicianJWT, technicianController.requestSpare);
router.get('/job/:jobId/spares', authenticateTechnicianJWT, technicianController.getJobSpares);
router.post('/job/:jobId/scopes', authenticateTechnicianJWT, addScopesToJob);

export default router;
