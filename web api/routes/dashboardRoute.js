const express = require("express");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const Category = require("../models/categoryModel");
const authService = require("../services/authService");

const router = express.Router();

router.use(authService.protectOrApiKey);
router.use(authService.allowedTo("admin", "manager"));

router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const [usersCount, productsCount, ordersCount, categoriesCount] =
      await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Order.countDocuments(),
        Category.countDocuments(),
      ]);

    const recentOrders = await Order.find()
      .sort("-createdAt")
      .limit(10)
      .populate("user", "name email");

    const totalRevenue = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: "$totalOrderPrice" } } },
    ]);

    res.status(200).json({
      status: "success",
      data: {
        usersCount,
        productsCount,
        ordersCount,
        categoriesCount,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        recentOrders,
      },
    });
  })
);

module.exports = router;
