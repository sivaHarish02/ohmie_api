import { Router } from 'express';
import * as spareFilterController from '../controllers/spareFilter.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// --- Spare Categories ---
router.get('/by-job/:jobCategoryId', authenticateJWT, spareFilterController.getSpareCategoriesByJobCategory);
router.post('/', authenticateJWT, requireAdmin, spareFilterController.createSpareCategory);
router.put('/:id', authenticateJWT, requireAdmin, spareFilterController.updateSpareCategory);
router.delete('/:id', authenticateJWT, requireAdmin, spareFilterController.deleteSpareCategory);

export default router;
