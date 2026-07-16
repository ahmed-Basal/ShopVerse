const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const fs = require("fs");
const path = require("path");
require("colors");
const dotenv = require("dotenv");
const Product = require("../../models/productModel");
const dbConnection = require("../../config/database");

dotenv.config({ path: "../../env.config" });

dbConnection();

const products = JSON.parse(
  fs.readFileSync(path.join(__dirname, "products.json"))
);

const insertData = async () => {
  try {
    await Product.create(products);

    console.log("Data Inserted".green.inverse);
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

const destroyData = async () => {
  try {
    await Product.deleteMany();
    console.log("Data Destroyed".red.inverse);
    process.exit();
  } catch (error) {
    console.log(error);
  }
};

if (process.argv[2] === "-i") {
  insertData();
} else if (process.argv[2] === "-d") {
  destroyData();
}
