-- Optom savdo olib tashlandi
ALTER TABLE "Product" DROP COLUMN "wholesalePrice",
DROP COLUMN "wholesaleMin",
DROP COLUMN "stockPacks";

ALTER TABLE "Order" DROP COLUMN "isWholesale";

DELETE FROM "Setting" WHERE "key" IN ('retailEnabled', 'wholesaleEnabled');
