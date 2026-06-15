import prisma from '../utils/prisma';
import * as spareRepo from '../../src/modules/spare/spare.repository';
import { SpareInput, SpareUpdateInput } from '../types/spare.types';

export const listSpares = async (query: any) => {
    return spareRepo.findMany(query);
};

export const getSpare = async (id: number) => {
    return spareRepo.findById(id);
};

export const createSpare = async (data: SpareInput, errorHandler?: (error: any) => void) => {
    try {
        return await spareRepo.create(data);
    } catch (error) {
        if (errorHandler) {
            errorHandler(error);
        } else {
            throw error;
        }
    }
};

export const updateSpare = async (id: number, data: SpareUpdateInput) => {
    return spareRepo.update(id, data);
};

export const deleteSpare = async (id: number) => {
    return spareRepo.softDelete(id);
};

export const findLowStock = async () => {
    return spareRepo.findLowStock();
};

export const getSpareSummary = async () => {
    try {
        const totalSpares = await prisma.spare.count();
        const lowStockCount = await prisma.spare.count({
            where: {
                sellingPrice: {
                    lt: 10, // Example threshold for low stock
                },
            },
        });
        const stockValue = await prisma.spare.aggregate({
            _sum: {
                costPrice: true,
            },
        });

        return {
            totalSpares,
            lowStockCount,
            stockValue: stockValue._sum.costPrice || 0,
        };
    } catch (error) {
        console.error('Error fetching spare summary:', error);
        throw new Error('Failed to fetch spare summary');
    }
}