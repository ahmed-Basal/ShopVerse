const fs = require("fs");
const path = require("path");
const User = require("../../models/userModel");
const Product = require("../../models/productModel");
const Category = require("../../models/categoryModel");
const Brand = require("../../models/brandModel");

const seedUsers = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" });
    const managerExists = await User.findOne({ role: "manager" });

    if (!adminExists) {
      await User.create({
        name: "Admin User",
        email: "admin@gmail.com",
        password: "adminpassword123",
        role: "admin",
      });
      console.log("Default admin user seeded.");
    }

    if (!managerExists) {
      await User.create({
        name: "Manager User",
        email: "manager@gmail.com",
        password: "managerpassword123",
        role: "manager",
      });
      console.log("Default manager user seeded.");
    }

    const hasNewCategory = await Category.findOne({ name: "mobile" });
    if (!hasNewCategory) {
      console.log("Old categories detected. Cleaning up and seeding new categories/products...");
      await Category.deleteMany();
      await Product.deleteMany();
    }

    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      await Category.create([
        {
          _id: "61b2a9d869d54640ca3d7293",
          name: "mobile",
          slug: "mobile",
        },
        {
          _id: "61b7a02868424f7846ce1d6f",
          name: "laptop",
          slug: "laptop",
        },
        {
          _id: "61b2a8dd4bad61f4cc4a98ea",
          name: "audio",
          slug: "audio",
        },
        {
          name: "gaming",
          slug: "gaming",
        },
        {
          name: "tv",
          slug: "tv",
        },
        {
          name: "appliances",
          slug: "appliances",
        },
      ]);
      console.log("Default categories seeded successfully.");
    }

    const brandCount = await Brand.countDocuments();
    if (brandCount === 0) {
      await Brand.create([
        {
          _id: "61b2a9d869d54640ca3d7294",
          name: "Apple",
          slug: "apple",
        },
      ]);
      console.log("Default brand seeded successfully.");
    }

    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const productsData = JSON.parse(
        fs.readFileSync(path.join(__dirname, "products.json"), "utf8")
      );
      await Product.create(productsData);
      console.log("Default products seeded successfully.");
    }
  } catch (error) {
    console.error("Error seeding default users/products/categories:", error);
  }
};

module.exports = seedUsers;
