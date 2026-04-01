/*
  Warnings:

  - A unique constraint covering the columns `[documento]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "documento" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_documento_key" ON "Customer"("documento");
