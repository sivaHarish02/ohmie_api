import prisma from '../utils/prisma';

// Get spare categories by job category ID
export const getSpareCategoriesByJobCategory = async (jobCategoryId: number) => {
    const category = await prisma.category.findUnique({ where: { id: jobCategoryId } });
    if (!category) {
        throw new Error('Job category not found');
    }

    return prisma.spareCategory.findMany({
        where: {
            jobCategoryId,
            isActive: true,
        },
        select: {
            id: true,
            name: true,
            jobCategoryId: true,
        },
        orderBy: { name: 'asc' },
    });
};

// Get all active brands
export const getAllBrands = async () => {
    return prisma.brand.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
        },
        orderBy: { name: 'asc' },
    });
};

// Get spares with filters
export const getFilteredSpares = async (spareCategoryId?: number, brandId?: number) => {
    const where: any = { isActive: true };

    if (spareCategoryId) {
        const spareCategory = await prisma.spareCategory.findUnique({ where: { id: spareCategoryId } });
        if (!spareCategory) {
            throw new Error('Spare category not found');
        }
        where.spareCategoryId = spareCategoryId;
    }

    if (brandId) {
        const brand = await prisma.brand.findUnique({ where: { id: brandId } });
        if (!brand) {
            throw new Error('Brand not found');
        }
        where.brandId = brandId;
    }

    return prisma.spare.findMany({
        where,
        include: {
            spareCategory: { select: { id: true, name: true } },
            brand: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
    });
};

// CRUD for SpareCategory
export const createSpareCategory = async (data: { name: string; jobCategoryId: number }) => {
    return prisma.spareCategory.create({ data });
};

export const updateSpareCategory = async (id: number, data: { name?: string; isActive?: boolean }) => {
    return prisma.spareCategory.update({ where: { id }, data });
};

export const deleteSpareCategory = async (id: number) => {
    return prisma.spareCategory.update({ where: { id }, data: { isActive: false } });
};

// CRUD for Brand
export const createBrand = async (name: string) => {
    return prisma.brand.create({ data: { name } });
};

export const updateBrand = async (id: number, data: { name?: string; isActive?: boolean }) => {
    return prisma.brand.update({ where: { id }, data });
};

export const deleteBrand = async (id: number) => {
    return prisma.brand.update({ where: { id }, data: { isActive: false } });
};
