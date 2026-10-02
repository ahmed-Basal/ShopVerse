const asyncHandler = require("express-async-handler");
const prisma = require("../config/prismaClient");

exports.addProductToWishlist = asyncHandler(async (req, res, next) => {
  // Upsert: add to wishlist (ignore if already exists)
  await prisma.wishlistItem.upsert({
    where: {
      userId_productId: {
        userId: req.user.id,
        productId: req.body.productId,
      },
    },
    update: {},
    create: {
      userId: req.user.id,
      productId: req.body.productId,
    },
  });

  const wishlist = await prisma.wishlistItem.findMany({
    where: { userId: req.user.id },
    select: { productId: true },
  });

  res.status(200).json({
    status: "success",
    message: "Product added successfully to your wishlist.",
    data: wishlist.map((w) => w.productId),
  });
});

exports.removeProductFromWishlist = asyncHandler(async (req, res, next) => {
  await prisma.wishlistItem.deleteMany({
    where: { userId: req.user.id, productId: req.params.productId },
  });

  const wishlist = await prisma.wishlistItem.findMany({
    where: { userId: req.user.id },
    select: { productId: true },
  });

  res.status(200).json({
    status: "success",
    message: "Product removed successfully from your wishlist.",
    data: wishlist.map((w) => w.productId),
  });
});

exports.getLoggedUserWishlist = asyncHandler(async (req, res, next) => {
  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { userId: req.user.id },
    include: {
      product: {
        include: {
          category: { select: { name: true } },
          brand: { select: { name: true } },
        },
      },
    },
  });

  res.status(200).json({
    status: "success",
    results: wishlistItems.length,
    data: wishlistItems.map((w) => w.product),
  });
});
