import { Request, Response } from 'express';
import * as spareService from '../services/spare.service';
import { log } from 'console';


export const getSpareSummary = async (req: Request, res: Response) => {
    try {
        log('getSpareSummary called');
        const summary = await spareService.getSpareSummary();
        log('Spare Summary: ', summary);
        res.status(200).json(summary);
    } catch (error) {
        console.error('Error fetching spare summary:', error);
        res.status(500).json({ message: 'Failed to fetch spare summary', error });
    }
}
export const listSpares = async (req: Request, res: Response) => {
    try {
        // Pagination, search, filter
        const { page = 1, limit = 20, search, lowStock } = req.query;
        console.log("listSpares called with query:", req.query);

        const where: any = {};
        if (search) where.name = { contains: String(search), };
        if (lowStock) where.stockQty = { lte: { minStock: true }, };
        const spares = await spareService.listSpares({
            where,
            include: {
                category: { select: { id: true, name: true } },
                spareCategory: { select: { id: true, name: true } },
                brand: { select: { id: true, name: true } },
            },
            orderBy: { id: 'desc' },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit),
        });
        // console.log("Spares fetched:", spares.length);
        res.json(spares);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
};

export const createSpare = async (req: Request, res: Response) => {
    try {
        log('createSpare called with body:', req.body);
        const spare = await spareService.createSpare(req.body);
        log('Spare created:', spare);
        res.status(201).json(spare);
    } catch (e: any) {
        log('Error creating spare:', e);
        res.status(400).json({ error: e.message });
    }
};

export const updateSpare = async (req: Request, res: Response) => {
    try {
        log('updateSpare called with id:', req.params.id, 'and body:', req.body);
        const spare = await spareService.updateSpare(Number(req.params.id), req.body);
        log('Spare updated:', spare);
        res.json(spare);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
};

export const deleteSpare = async (req: Request, res: Response) => {
    try {
        await spareService.deleteSpare(Number(req.params.id));
        res.json({ message: 'Spare deleted (soft)' });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
};

export const lowStockSpares = async (_req: Request, res: Response) => {
    try {
        const spares = await spareService.findLowStock();
        res.json(spares);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
};
