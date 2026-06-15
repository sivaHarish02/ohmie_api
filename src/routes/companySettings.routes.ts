import { Router } from 'express';
import { authenticateJWT, authenticateTechnicianJWT } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import * as settingsController from '../controllers/companySettings.controller';

const router = Router();

// Admin: get and update payment settings
router.get('/', authenticateJWT, requireAdmin, settingsController.getPaymentSettings);
router.put('/', authenticateJWT, requireAdmin, settingsController.updatePaymentSettings);

// Technician: get only (needs to show QR/UPI during payment)
router.get('/technician', authenticateTechnicianJWT, settingsController.getPaymentSettings);

export default router;
