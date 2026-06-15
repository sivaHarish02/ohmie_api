export interface SpareInput {
    name: string;
    sku: string;
    // either provide existing category id or category name (will be upserted)
    categoryId?: number;
    category?: string;
    spareCategoryId?: number;
    brandId?: number;
    costPrice: number;
    sellingPrice: number;
    stockQty?: number;
    minStock?: number;
}

export interface SpareUpdateInput {
    name?: string;
    sku?: string;
    categoryId?: number;
    category?: string;
    spareCategoryId?: number;
    brandId?: number;
    costPrice?: number;
    sellingPrice?: number;
    stockQty?: number;
    minStock?: number;
    isActive?: boolean;
}
