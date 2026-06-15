-- DropIndex
DROP INDEX `CustomSpareRequest_technicianId_fkey` ON `customsparerequest`;

-- DropIndex
DROP INDEX `Job_categoryId_fkey` ON `job`;

-- DropIndex
DROP INDEX `Job_technicianId_fkey` ON `job`;

-- DropIndex
DROP INDEX `Payment_jobId_fkey` ON `payment`;

-- DropIndex
DROP INDEX `Payout_technicianId_fkey` ON `payout`;

-- DropIndex
DROP INDEX `Spare_brandId_fkey` ON `spare`;

-- DropIndex
DROP INDEX `Spare_categoryId_fkey` ON `spare`;

-- DropIndex
DROP INDEX `Spare_spareCategoryId_fkey` ON `spare`;

-- DropIndex
DROP INDEX `SpareCategory_jobCategoryId_fkey` ON `sparecategory`;

-- DropIndex
DROP INDEX `SpareStockLog_spareId_fkey` ON `sparestocklog`;

-- DropIndex
DROP INDEX `SpareUsage_jobId_fkey` ON `spareusage`;

-- DropIndex
DROP INDEX `SpareUsage_spareId_fkey` ON `spareusage`;

-- DropIndex
DROP INDEX `TechnicianCategory_categoryId_fkey` ON `techniciancategory`;

-- DropIndex
DROP INDEX `WalletTransaction_technicianId_fkey` ON `wallettransaction`;

-- AddForeignKey
ALTER TABLE `TechnicianCategory` ADD CONSTRAINT `TechnicianCategory_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `Technician`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TechnicianCategory` ADD CONSTRAINT `TechnicianCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Job` ADD CONSTRAINT `Job_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `Technician`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Spare` ADD CONSTRAINT `Spare_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Spare` ADD CONSTRAINT `Spare_spareCategoryId_fkey` FOREIGN KEY (`spareCategoryId`) REFERENCES `SpareCategory`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Spare` ADD CONSTRAINT `Spare_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpareCategory` ADD CONSTRAINT `SpareCategory_jobCategoryId_fkey` FOREIGN KEY (`jobCategoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpareUsage` ADD CONSTRAINT `SpareUsage_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpareUsage` ADD CONSTRAINT `SpareUsage_spareId_fkey` FOREIGN KEY (`spareId`) REFERENCES `Spare`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpareStockLog` ADD CONSTRAINT `SpareStockLog_spareId_fkey` FOREIGN KEY (`spareId`) REFERENCES `Spare`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `Job`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Wallet` ADD CONSTRAINT `Wallet_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `Technician`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WalletTransaction` ADD CONSTRAINT `WalletTransaction_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `Technician`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payout` ADD CONSTRAINT `Payout_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `Technician`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomSpareRequest` ADD CONSTRAINT `CustomSpareRequest_technicianId_fkey` FOREIGN KEY (`technicianId`) REFERENCES `Technician`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
