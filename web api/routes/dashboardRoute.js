const express = require("express");
const asyncHandler = require("express-async-handler");
const authService = require("../services/authService");
const prisma = require("../config/prismaClient");

const router = express.Router();

router.use(authService.protectOrApiKey);
router.use(authService.allowedTo("admin", "manager"));

router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const [usersCount, productsCount, ordersCount, categoriesCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.category.count(),
      ]);

    const recentOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { name: true, email: true } },
        orderItems: { include: { product: { select: { title: true } } } },
      },
    });

    const revenueResult = await prisma.order.aggregate({
      where: { isPaid: true },
      _sum: { totalOrderPrice: true },
    });

    res.status(200).json({
      status: "success",
      data: {
        usersCount,
        productsCount,
        ordersCount,
        categoriesCount,
        totalRevenue: revenueResult._sum.totalOrderPrice || 0,
        recentOrders,
      },
    });
  })
);

module.exports = router;
