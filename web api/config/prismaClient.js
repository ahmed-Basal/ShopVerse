const { PrismaClient } = require("@prisma/client");

// Singleton pattern to avoid creating multiple Prisma instances in development
let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ["error"],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
