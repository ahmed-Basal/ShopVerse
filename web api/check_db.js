const dotenv = require("dotenv");

dotenv.config({ path: ".env" });

const prisma = require("./config/prismaClient");

async function run() {
  const prodCount = await prisma.product.count();
  const catCount = await prisma.category.count();
  console.log("Total Products in DB:", prodCount);
  console.log("Total Categories in DB:", catCount);

  if (prodCount > 0) {
    const sample = await prisma.product.findFirst({
      include: { category: true },
    });
    console.log("Sample Product:", sample.title);
    console.log("Sample Product Category:", sample.category?.name);
  }

  await prisma.$disconnect();
}

run();
