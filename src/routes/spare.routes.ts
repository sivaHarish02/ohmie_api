import { Router } from 'express';
import * as spareController from '../controllers/spare.controller';
import * as spareFilterController from '../controllers/spareFilter.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

router.get('/filter', authenticateJWT, spareFilterController.getFilteredSpares);
router.get('/', authenticateJWT, requireAdmin, spareController.listSpares);
router.post('/', authenticateJWT, requireAdmin, spareController.createSpare);
router.put('/:id', authenticateJWT, requireAdmin, spareController.updateSpare);
router.delete('/:id', authenticateJWT, requireAdmin, spareController.deleteSpare);
router.get('/low-stock', authenticateJWT, requireAdmin, spareController.lowStockSpares);
router.get('/summary', spareController.getSpareSummary);

export default router;
