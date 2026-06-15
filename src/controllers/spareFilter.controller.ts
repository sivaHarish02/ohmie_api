import { Request, Response } from 'express';
import * as spareFilterService from '../services/spareFilter.service';

// GET /spare-categories/by-job/:jobCategoryId
export const getSpareCategoriesByJobCategory = async (req: Request, res: Response) => {
    try {
        const jobCategoryId = parseInt(req.params.jobCategoryId);
        if (isNaN(jobCategoryId)) {
            return res.status(400).json({ error: 'Invalid jobCategoryId' });
        }

        const categories = await spareFilterService.getSpareCategoriesByJobCategory(jobCategoryId);
        res.json(categories);
    } catch (e: any) {
        if (e.message === 'Job category not found') {
            return res.status(404).json({ error: e.message });
        }
        res.status(500).json({ error: 'Failed to fetch spare categories' });
    }
};

// GET /brands
export const getAllBrands = async (_req: Request, res: Response) => {
    try {
        const brands = await spareFilterService.getAllBrands();
        res.json(brands);
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to fetch brands' });
    }
};

// GET /spares/filter?spareCategoryId=&brandId=
export const getFilteredSpares = async (req: Request, res: Response) => {
    try {
        const spareCategoryId = req.query.spareCategoryId ? parseInt(req.query.spareCategoryId as string) : undefined;
        const brandId = req.query.brandId ? parseInt(req.query.brandId as string) : undefined;

        if (spareCategoryId !== undefined && isNaN(spareCategoryId)) {
            return res.status(400).json({ error: 'Invalid spareCategoryId' });
        }
        if (brandId !== undefined && isNaN(brandId)) {
            return res.status(400).json({ error: 'Invalid brandId' });
        }

        const spares = await spareFilterService.getFilteredSpares(spareCategoryId, brandId);
        res.json(spares);
    } catch (e: any) {
        if (e.message === 'Spare category not found' || e.message === 'Brand not found') {
            return res.status(404).json({ error: e.message });
        }
        res.status(500).json({ error: 'Failed to fetch spares' });
    }
};

// POST /spare-categories
export const createSpareCategory = async (req: Request, res: Response) => {
    try {
        const { name, jobCategoryId } = req.body;
        if (!name || !jobCategoryId) {
            return res.status(400).json({ error: 'name and jobCategoryId are required' });
        }

        const category = await spareFilterService.createSpareCategory({ name, jobCategoryId: parseInt(jobCategoryId) });
        res.status(201).json(category);
    } catch (e: any) {
        if (e.code === 'P2002') {
            return res.status(409).json({ error: 'Spare category with this name already exists for this job category' });
        }
        res.status(500).json({ error: 'Failed to create spare category' });
    }
};

// PUT /spare-categories/:id
export const updateSpareCategory = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

        const category = await spareFilterService.updateSpareCategory(id, req.body);
        res.json(category);
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to update spare category' });
    }
};

// DELETE /spare-categories/:id
export const deleteSpareCategory = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

        await spareFilterService.deleteSpareCategory(id);
        res.json({ message: 'Spare category deleted' });
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to delete spare category' });
    }
};

// POST /brands
export const createBrand = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'name is required' });

        const brand = await spareFilterService.createBrand(name);
        res.status(201).json(brand);
    } catch (e: any) {
        if (e.code === 'P2002') {
            return res.status(409).json({ error: 'Brand with this name already exists' });
        }
        res.status(500).json({ error: 'Failed to create brand' });
    }
};

// PUT /brands/:id
export const updateBrand = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

        const brand = await spareFilterService.updateBrand(id, req.body);
        res.json(brand);
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to update brand' });
    }
};

// DELETE /brands/:id
export const deleteBrand = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

        await spareFilterService.deleteBrand(id);
        res.json({ message: 'Brand deleted' });
    } catch (e: any) {
        res.status(500).json({ error: 'Failed to delete brand' });
    }
};
