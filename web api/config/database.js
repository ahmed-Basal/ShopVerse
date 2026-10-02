const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

const dbConnection = async () => {
  try {
    await prisma.$connect();
    console.log("PostgreSQL Database Connected successfully via Prisma");
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1);
  }
};

module.exports = dbConnection;
module.exports.prisma = prisma;
