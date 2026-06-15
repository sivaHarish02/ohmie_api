import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { emitToAllAdmins } from '../socket/socket.server';

const prisma = new PrismaClient();

// Technician creates a new scope (PENDING)
export const createScope = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, jobCategoryId } = req.body;

        // Assume technician id from token if needed, or pass from middleware
        // The user specifies: status = PENDING, createdBy = TECHNICIAN
        const technicianId = (req as any).user?.id; // Optional for socket payload

        const scope = await prisma.scopeOfWork.create({
            data: {
                name,
                jobCategoryId: Number(jobCategoryId),
                status: 'PENDING',
                createdBy: 'TECHNICIAN'
            }
        });

        // Emit socket event to admin
        emitToAllAdmins('new_scope_request', {
            scopeName: name,
            technicianId: technicianId || 0
        });

        res.status(201).json({ message: 'Scope created successfully', scope });
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Scope name already exists for this category' });
            return;
        }
        res.status(500).json({ error: 'Failed to create scope', details: error.message });
    }
};

// Get APPROVED scopes by category
export const getApprovedScopesByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { jobCategoryId } = req.params;
        console.log("getApprovedScopesByCategory:", req.params);


        const scopes = await prisma.scopeOfWork.findMany({
            where: {
                jobCategoryId: Number(jobCategoryId),
                status: 'APPROVED'
            }
        });

        res.status(200).json(scopes);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch scopes', details: error.message });
    }
};

// Admin gets pending scopes
export const getPendingScopes = async (req: Request, res: Response): Promise<void> => {
    try {
        const scopes = await prisma.scopeOfWork.findMany({
            where: {
                status: 'PENDING'
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json(scopes);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch pending scopes', details: error.message });
    }
};

// Admin approves a scope
export const approveScope = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const scope = await prisma.scopeOfWork.update({
            where: { id: Number(id) },
            data: { status: 'APPROVED' }
        });

        res.status(200).json({ message: 'Scope approved', scope });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to approve scope', details: error.message });
    }
};

// Admin rejects a scope
export const rejectScope = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const scope = await prisma.scopeOfWork.update({
            where: { id: Number(id) },
            data: { status: 'REJECTED' }
        });

        res.status(200).json({ message: 'Scope rejected', scope });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to reject scope', details: error.message });
    }
};

// Add scopes to a job
export const addScopesToJob = async (req: Request, res: Response): Promise<void> => {
    try {
        const { jobId } = req.params;
        const { scopeIds } = req.body; // Array of IDs

        if (!Array.isArray(scopeIds) || scopeIds.length === 0) {
            res.status(400).json({ error: 'At least one scope is required' });
            return;
        }

        // Run in transaction: delete existing and create new
        await prisma.$transaction(async (tx) => {
            await tx.jobScope.deleteMany({
                where: { jobId: Number(jobId) }
            });

            const jobScopesData = scopeIds.map((scopeId: number) => ({
                jobId: Number(jobId),
                scopeOfWorkId: Number(scopeId)
            }));

            await tx.jobScope.createMany({
                data: jobScopesData
            });
        });

        res.status(200).json({ message: 'Scopes added to job successfully' });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to add scopes to job', details: error.message });
    }
};
