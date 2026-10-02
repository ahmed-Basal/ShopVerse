const prisma = require("../../config/prismaClient");
const { insertData } = require("./seeder");

const seedUsers = async () => {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log("Database is empty. Running initial seed...");
      await insertData();
    }
  } catch (error) {
    console.error("Error in initial seed:", error);
  }
};

module.exports = seedUsers;
