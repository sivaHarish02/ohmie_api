import { Router } from 'express';
import * as spareFilterController from '../controllers/spareFilter.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

router.get('/', authenticateJWT, spareFilterController.getAllBrands);
router.post('/', authenticateJWT, requireAdmin, spareFilterController.createBrand);
router.put('/:id', authenticateJWT, requireAdmin, spareFilterController.updateBrand);
router.delete('/:id', authenticateJWT, requireAdmin, spareFilterController.deleteBrand);

export default router;
