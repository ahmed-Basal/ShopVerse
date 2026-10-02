const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const prisma = require("../config/prismaClient");

// Helper to calculate cart total
const calcTotalCartPrice = (cartItems) => {
  return cartItems.reduce((total, item) => total + item.quantity * item.price, 0);
};

// Helper to format cart response so both id and _id exist, and images/categories are properly resolved
const formatCartResponse = (cart) => {
  if (!cart) return null;
  const baseUrl = process.env.BASE_URL || "http://localhost:8000";

  const formattedItems = (cart.cartItems || []).map((item) => {
    const rawImage = item.product?.imageCover || "";
    const imageCover = rawImage.startsWith("http") || rawImage.startsWith("data:")
      ? rawImage
      : `${baseUrl}/products/${rawImage}`;

    const catName =
      typeof item.product?.category === "object" && item.product?.category?.name
        ? item.product.category.name
        : typeof item.product?.category === "string"
        ? item.product.category
        : "General";

    return {
      id: item.id,
      _id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      color: item.color,
      price: item.price,
      quantity: item.quantity,
      product: item.product
        ? {
            id: item.product.id || item.productId,
            _id: item.product.id || item.productId,
            title: item.product.title,
            imageCover,
            image: imageCover,
            price: item.product.price,
            description: item.product.description,
            colors: item.product.colors,
            category: catName,
          }
        : null,
    };
  });

  return {
    id: cart.id,
    _id: cart.id,
    userId: cart.userId,
    totalCartPrice: cart.totalCartPrice,
    totalPriceAfterDiscount: cart.totalPriceAfterDiscount,
    cartItems: formattedItems,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
};

const cartInclude = {
  cartItems: {
    include: {
      product: {
        select: {
          id: true,
          title: true,
          imageCover: true,
          price: true,
          description: true,
          colors: true,
          category: { select: { name: true } },
        },
      },
    },
  },
};

exports.addProductToCart = asyncHandler(async (req, res, next) => {
  const { productId, color, quantity = 1 } = req.body;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return next(new ApiError("Product not found", 404));

  const itemPrice =
    product.priceAfterDiscount && product.priceAfterDiscount < product.price
      ? product.priceAfterDiscount
      : product.price;

  // Get or create cart
  let cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: { cartItems: true },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId: req.user.id,
        totalCartPrice: itemPrice * qty,
        cartItems: {
          create: [{ productId, color: color || null, price: itemPrice, quantity: qty }],
        },
      },
      include: cartInclude,
    });
  } else {
    const existingItem = cart.cartItems.find(
      (item) => item.productId === productId && item.color === (color || null)
    );

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + qty },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, color: color || null, price: itemPrice, quantity: qty },
      });
    }

    cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: { cartItems: true },
    });

    const total = calcTotalCartPrice(cart.cartItems);
    cart = await prisma.cart.update({
      where: { userId: req.user.id },
      data: { totalCartPrice: total, totalPriceAfterDiscount: null },
      include: cartInclude,
    });
  }

  // Reload fully formatted cart
  const finalCart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: cartInclude,
  });

  const formatted = formatCartResponse(finalCart);
  res.status(200).json({
    status: "success",
    message: "Product added to cart successfully",
    numOfCartItems: formatted.cartItems.length,
    data: formatted,
  });
});

exports.getLoggedUserCart = asyncHandler(async (req, res, next) => {
  const cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: cartInclude,
  });

  if (!cart) {
    return next(new ApiError(`There is no cart for this user id : ${req.user.id}`, 404));
  }

  const formatted = formatCartResponse(cart);
  res.status(200).json({
    status: "success",
    numOfCartItems: formatted.cartItems.length,
    data: formatted,
  });
});

exports.removeSpecificCartItem = asyncHandler(async (req, res, next) => {
  const { itemId } = req.params;

  const cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: { cartItems: true },
  });
  if (!cart) return next(new ApiError("No cart found", 404));

  // Find item by cartItem.id OR productId
  const targetItem = cart.cartItems.find(
    (item) => item.id === itemId || item.productId === itemId
  );

  if (!targetItem) {
    return next(new ApiError(`No cart item found with id: ${itemId}`, 404));
  }

  await prisma.cartItem.delete({ where: { id: targetItem.id } });

  // Reload and recalculate
  const updatedCart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: { cartItems: true },
  });

  const total = calcTotalCartPrice(updatedCart ? updatedCart.cartItems : []);
  const finalCart = await prisma.cart.update({
    where: { userId: req.user.id },
    data: { totalCartPrice: total, totalPriceAfterDiscount: null },
    include: cartInclude,
  });

  const formatted = formatCartResponse(finalCart);
  res.status(200).json({
    status: "success",
    numOfCartItems: formatted.cartItems.length,
    data: formatted,
  });
});

exports.clearCart = asyncHandler(async (req, res, next) => {
  const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
  if (cart) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.delete({ where: { userId: req.user.id } });
  }
  res.status(204).send();
});

exports.updateCartItemQuantity = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;
  const { itemId } = req.params;

  const cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: { cartItems: true },
  });
  if (!cart) return next(new ApiError(`There is no cart for user ${req.user.id}`, 404));

  const targetItem = cart.cartItems.find(
    (item) => item.id === itemId || item.productId === itemId
  );
  if (!targetItem) return next(new ApiError(`There is no item for this id: ${itemId}`, 404));

  await prisma.cartItem.update({ where: { id: targetItem.id }, data: { quantity } });

  const updatedCart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: { cartItems: true },
  });
  const total = calcTotalCartPrice(updatedCart.cartItems);

  const finalCart = await prisma.cart.update({
    where: { userId: req.user.id },
    data: { totalCartPrice: total },
    include: cartInclude,
  });

  const formatted = formatCartResponse(finalCart);
  res.status(200).json({
    status: "success",
    numOfCartItems: formatted.cartItems.length,
    data: formatted,
  });
});

exports.applyCoupon = asyncHandler(async (req, res, next) => {
  const { coupon } = req.body;

  const couponDoc = await prisma.coupon.findUnique({
    where: { name: coupon },
  });

  if (!couponDoc || couponDoc.expire < new Date()) {
    return next(new ApiError("Coupon is invalid or expired", 400));
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: cartInclude,
  });
  if (!cart) return next(new ApiError(`There is no cart for user ${req.user.id}`, 404));

  const totalPrice = cart.totalCartPrice;
  const totalPriceAfterDiscount = (
    totalPrice - (totalPrice * couponDoc.discount) / 100
  ).toFixed(2);

  const finalCart = await prisma.cart.update({
    where: { userId: req.user.id },
    data: { totalPriceAfterDiscount: parseFloat(totalPriceAfterDiscount) },
    include: cartInclude,
  });

  const formatted = formatCartResponse(finalCart);
  res.status(200).json({
    status: "success",
    numOfCartItems: formatted.cartItems.length,
    data: formatted,
  });
});
