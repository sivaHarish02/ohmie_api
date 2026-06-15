import { Router } from 'express';
import {
    createScope,
    getApprovedScopesByCategory,
    getPendingScopes,
    approveScope,
    rejectScope
} from '../controllers/scopeOfWork.controller';

const router = Router();

// Technician APIs
router.post('/', createScope);
router.get('/by-category/:jobCategoryId', getApprovedScopesByCategory);

// Admin APIs
router.get('/pending', getPendingScopes);
router.put('/:id/approve', approveScope);
router.put('/:id/reject', rejectScope);

export default router;
