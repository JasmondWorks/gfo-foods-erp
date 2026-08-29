# Prisma Schema — Food Processing Business ERP

Save the block below as `prisma/schema.prisma`.

```prisma
// ============================================================
// Food Processing Business — Data Model
// Flow: RawMaterial -> Recipe -> Batch -> Product -> Sale
// ============================================================

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Unit {
  G      // grams
  KG
  ML
  L
  PIECE
  PACK
}

enum PaymentStatus {
  PAID
  PARTIAL
  UNPAID
}

enum AdjustmentTarget {
  RAW_MATERIAL
  PRODUCT
}

// ------------------------------------------------------------
// 0. AUTH — single seeded user
// ------------------------------------------------------------
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String?
  createdAt    DateTime @default(now())
}

// ------------------------------------------------------------
// 1. RAW MATERIALS
// ------------------------------------------------------------
model RawMaterial {
  id               String   @id @default(cuid())
  name             String   // e.g. "Ground Pepper", "50g Sachet Bags"
  unit             Unit
  quantityOnHand   Decimal  @default(0) @db.Decimal(12, 3)
  reorderThreshold Decimal  @default(0) @db.Decimal(12, 3)
  averageCost      Decimal  @default(0) @db.Decimal(12, 2) // cost per unit, updated on purchase
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  purchases        RawMaterialPurchase[]
  recipeIngredients RecipeIngredient[]
  batchConsumptions BatchConsumption[]
}

// Every time she buys raw material, this increases quantityOnHand
model RawMaterialPurchase {
  id            String      @id @default(cuid())
  rawMaterial   RawMaterial @relation(fields: [rawMaterialId], references: [id])
  rawMaterialId String
  quantity      Decimal     @db.Decimal(12, 3)
  unitCost      Decimal     @db.Decimal(12, 2)
  totalCost     Decimal     @db.Decimal(12, 2)
  supplier      String?
  purchasedAt   DateTime    @default(now())
  notes         String?
}

// ------------------------------------------------------------
// 2. PRODUCTS (finished goods) & RECIPES
// ------------------------------------------------------------
model Product {
  id             String   @id @default(cuid())
  name           String   // e.g. "Suya Spice Mix 50g"
  packageSize    String?  // e.g. "50g", "200g" — free text, keeps it simple
  sellingPrice   Decimal  @db.Decimal(12, 2)
  quantityOnHand Decimal  @default(0) @db.Decimal(12, 3)
  trackExpiry    Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  recipe   Recipe?  // one product = one recipe (a product IS the recipe's output)
  batches  Batch[]
  saleItems SaleItem[]
}

// The formula for producing one "yield unit" of a product
model Recipe {
  id          String   @id @default(cuid())
  product     Product  @relation(fields: [productId], references: [id])
  productId   String   @unique
  yieldQty    Decimal  @db.Decimal(12, 3) // how much finished product one "batch run" of this recipe produces
  yieldUnit   Unit
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  ingredients RecipeIngredient[]
}

// Line items: "this recipe needs X quantity of raw material Y"
model RecipeIngredient {
  id            String      @id @default(cuid())
  recipe        Recipe      @relation(fields: [recipeId], references: [id])
  recipeId      String
  rawMaterial   RawMaterial @relation(fields: [rawMaterialId], references: [id])
  rawMaterialId String
  quantity      Decimal     @db.Decimal(12, 3) // amount needed per one yield unit of the recipe

  @@unique([recipeId, rawMaterialId])
}

// ------------------------------------------------------------
// 3. PRODUCTION / BATCHES
// ------------------------------------------------------------
model Batch {
  id             String    @id @default(cuid())
  batchNumber    String    @unique // e.g. "SUYA-2026-0829-01"
  product        Product   @relation(fields: [productId], references: [id])
  productId      String
  quantityMade   Decimal   @db.Decimal(12, 3)
  producedAt     DateTime  @default(now())
  expiryDate     DateTime?
  notes          String?

  consumptions   BatchConsumption[] // actual raw materials deducted for this specific run
}

// Records exactly what raw materials were consumed for a given batch
// (mirrors the recipe at the time of production — kept separate for traceability
// even if the recipe changes later)
model BatchConsumption {
  id            String      @id @default(cuid())
  batch         Batch       @relation(fields: [batchId], references: [id])
  batchId       String
  rawMaterial   RawMaterial @relation(fields: [rawMaterialId], references: [id])
  rawMaterialId String
  quantityUsed  Decimal     @db.Decimal(12, 3)
}

// ------------------------------------------------------------
// 4. CUSTOMERS & SALES
// ------------------------------------------------------------
model Customer {
  id        String   @id @default(cuid())
  name      String
  phone     String?
  createdAt DateTime @default(now())

  sales     Sale[]
}

model Sale {
  id            String        @id @default(cuid())
  customer      Customer?     @relation(fields: [customerId], references: [id])
  customerId    String?
  saleDate      DateTime      @default(now())
  totalAmount   Decimal       @db.Decimal(12, 2)
  amountPaid    Decimal       @default(0) @db.Decimal(12, 2)
  paymentStatus PaymentStatus @default(PAID)
  notes         String?

  items         SaleItem[]
}

model SaleItem {
  id          String   @id @default(cuid())
  sale        Sale     @relation(fields: [saleId], references: [id])
  saleId      String
  product     Product  @relation(fields: [productId], references: [id])
  productId   String
  quantity    Decimal  @db.Decimal(12, 3)
  unitPrice   Decimal  @db.Decimal(12, 2)
  lineTotal   Decimal  @db.Decimal(12, 2)
}

// ------------------------------------------------------------
// 5. EXPENSES (non-raw-material costs)
// ------------------------------------------------------------
model Expense {
  id        String   @id @default(cuid())
  category  String   // e.g. "Transport", "Packaging Design", "Rent"
  amount    Decimal  @db.Decimal(12, 2)
  date      DateTime @default(now())
  notes     String?
}

// ------------------------------------------------------------
// 6. STOCK ADJUSTMENTS — the reconciliation safety valve
// Lets her physically count stock and reset the system to reality,
// logging the variance instead of silently discarding it.
// ------------------------------------------------------------
model StockAdjustment {
  id              String           @id @default(cuid())
  targetType      AdjustmentTarget
  rawMaterialId   String?
  productId       String?
  systemQuantity  Decimal          @db.Decimal(12, 3) // what the system thought
  countedQuantity Decimal          @db.Decimal(12, 3) // what she actually counted
  variance        Decimal          @db.Decimal(12, 3) // counted - system
  reason          String?          // "spillage", "forgot to log sale", "gift"
  adjustedAt      DateTime         @default(now())

  @@index([targetType, adjustedAt])
}
```
