-- CreateTable
CREATE TABLE "POS" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "POS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryGroupToPOS" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CategoryToPOS" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_POSToSystemUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_POSToProductTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryGroupToPOS_AB_unique" ON "_CategoryGroupToPOS"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryGroupToPOS_B_index" ON "_CategoryGroupToPOS"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryToPOS_AB_unique" ON "_CategoryToPOS"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryToPOS_B_index" ON "_CategoryToPOS"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_POSToSystemUser_AB_unique" ON "_POSToSystemUser"("A", "B");

-- CreateIndex
CREATE INDEX "_POSToSystemUser_B_index" ON "_POSToSystemUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_POSToProductTag_AB_unique" ON "_POSToProductTag"("A", "B");

-- CreateIndex
CREATE INDEX "_POSToProductTag_B_index" ON "_POSToProductTag"("B");

-- AddForeignKey
ALTER TABLE "_CategoryGroupToPOS" ADD CONSTRAINT "_CategoryGroupToPOS_A_fkey" FOREIGN KEY ("A") REFERENCES "CategoryGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryGroupToPOS" ADD CONSTRAINT "_CategoryGroupToPOS_B_fkey" FOREIGN KEY ("B") REFERENCES "POS"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToPOS" ADD CONSTRAINT "_CategoryToPOS_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToPOS" ADD CONSTRAINT "_CategoryToPOS_B_fkey" FOREIGN KEY ("B") REFERENCES "POS"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_POSToSystemUser" ADD CONSTRAINT "_POSToSystemUser_A_fkey" FOREIGN KEY ("A") REFERENCES "POS"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_POSToSystemUser" ADD CONSTRAINT "_POSToSystemUser_B_fkey" FOREIGN KEY ("B") REFERENCES "SystemUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_POSToProductTag" ADD CONSTRAINT "_POSToProductTag_A_fkey" FOREIGN KEY ("A") REFERENCES "POS"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_POSToProductTag" ADD CONSTRAINT "_POSToProductTag_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
