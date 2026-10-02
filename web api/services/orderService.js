const stripe = require("stripe")(process.env.STRIPE_SECRET);
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const prisma = require("../config/prismaClient");

exports.createCashOrder = asyncHandler(async (req, res, next) => {
  const taxPrice = 0;
  const shippingPrice = 0;

  const cart = await prisma.cart.findUnique({
    where: { id: req.params.cartId },
    include: { cartItems: { include: { product: true } } },
  });
  if (!cart) return next(new ApiError(`There is no such cart with id ${req.params.cartId}`, 404));

  const cartPrice = cart.totalPriceAfterDiscount ?? cart.totalCartPrice;
  const totalOrderPrice = cartPrice + taxPrice + shippingPrice;

  const order = await prisma.order.create({
    data: {
      userId: req.user.id,
      totalOrderPrice,
      shippingDetails: req.body.shippingAddress?.details || null,
      shippingPhone: req.body.shippingAddress?.phone || null,
      shippingCity: req.body.shippingAddress?.city || null,
      shippingPostalCode: req.body.shippingAddress?.postalCode || null,
      orderItems: {
        create: cart.cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          color: item.color,
          price: item.price,
        })),
      },
    },
    include: { orderItems: { include: { product: true } }, user: true },
  });

  // Update product quantity/sold
  await Promise.all(
    cart.cartItems.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: {
          quantity: { decrement: item.quantity },
          sold: { increment: item.quantity },
        },
      })
    )
  );

  // Delete cart
  await prisma.cart.delete({ where: { id: req.params.cartId } });

  res.status(201).json({ status: "success", data: order });
});

exports.filterOrderForLoggedUser = asyncHandler(async (req, res, next) => {
  if (req.user.role === "user") req.filterObj = { userId: req.user.id };
  next();
});

exports.findAllOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  const where = req.filterObj || {};

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, phone: true, profileImg: true } },
        orderItems: { include: { product: { select: { title: true, imageCover: true } } } },
      },
    }),
  ]);

  const paginationResult = { currentPage: page, limit, numberOfPages: Math.ceil(total / limit) };
  res.status(200).json({ results: orders.length, paginationResult, data: orders });
});

exports.findSpecificOrder = asyncHandler(async (req, res, next) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { name: true, email: true, phone: true, profileImg: true } },
      orderItems: { include: { product: { select: { title: true, imageCover: true } } } },
    },
  });
  if (!order) return next(new ApiError(`No order for this id ${req.params.id}`, 404));
  res.status(200).json({ data: order });
});

exports.updateOrderToPaid = asyncHandler(async (req, res, next) => {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { isPaid: true, paidAt: new Date() },
    });
    res.status(200).json({ status: "success", data: order });
  } catch (err) {
    if (err.code === "P2025") return next(new ApiError(`No order for this id ${req.params.id}`, 404));
    throw err;
  }
});

exports.updateOrderToDelivered = asyncHandler(async (req, res, next) => {
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { isDelivered: true, deliveredAt: new Date() },
    });
    res.status(200).json({ status: "success", data: order });
  } catch (err) {
    if (err.code === "P2025") return next(new ApiError(`No order for this id ${req.params.id}`, 404));
    throw err;
  }
});

exports.checkoutSession = asyncHandler(async (req, res, next) => {
  const cart = await prisma.cart.findUnique({
    where: { id: req.params.cartId },
    include: { cartItems: { include: { product: true } } },
  });
  if (!cart) return next(new ApiError(`There is no such cart with id ${req.params.cartId}`, 404));

  const cartPrice = cart.totalPriceAfterDiscount ?? cart.totalCartPrice;
  const discountRatio = cart.totalPriceAfterDiscount
    ? cart.totalPriceAfterDiscount / cart.totalCartPrice
    : 1;

  const line_items = cart.cartItems.map((item) => ({
    price_data: {
      currency: "egp",
      unit_amount: Math.round(item.price * discountRatio * 100),
      product_data: {
        name: item.product?.title || "Product",
        description: item.color ? `Color: ${item.color}` : undefined,
      },
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    line_items,
    mode: "payment",
    success_url: `http://localhost:4200/orders`,
    cancel_url: `http://localhost:4200/cart`,
    customer_email: req.user.email,
    client_reference_id: req.params.cartId,
    metadata: {
      details: req.body.shippingAddress?.details || "",
      phone: req.body.shippingAddress?.phone || "",
      city: req.body.shippingAddress?.city || "",
    },
  });

  res.status(200).json({ status: "success", session });
});

const createCardOrder = async (session) => {
  const cartId = session.client_reference_id;
  const shippingAddress = session.metadata;
  const orderPrice = session.amount_total / 100;

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { cartItems: { include: { product: true } } },
  });
  const user = await prisma.user.findFirst({ where: { email: session.customer_email } });

  if (!cart || !user) return;

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      totalOrderPrice: orderPrice,
      isPaid: true,
      paidAt: new Date(),
      paymentMethodType: "card",
      shippingDetails: shippingAddress?.details || null,
      shippingPhone: shippingAddress?.phone || null,
      shippingCity: shippingAddress?.city || null,
      orderItems: {
        create: cart.cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          color: item.color,
          price: item.price,
        })),
      },
    },
  });

  await Promise.all(
    cart.cartItems.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: {
          quantity: { decrement: item.quantity },
          sold: { increment: item.quantity },
        },
      })
    )
  );

  await prisma.cart.delete({ where: { id: cartId } });

  try {
    const notificationService = require("./notificationService");
    notificationService.sendNotificationToUser(user.id, {
      orderId: order.id,
      totalPrice: order.totalOrderPrice,
      message: `Your payment of EGP ${order.totalOrderPrice} was successful. Order #${order.id} is confirmed.`,
    });
  } catch (err) {
    console.error("Error sending SSE notification:", err);
  }
};

exports.webhookCheckout = asyncHandler(async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    if (
      process.env.NODE_ENV === "development" ||
      !process.env.STRIPE_WEBHOOK_SECRET ||
      process.env.STRIPE_WEBHOOK_SECRET === "whsec_replace_me"
    ) {
      try {
        event = JSON.parse(req.body.toString());
      } catch (jsonErr) {
        return res.status(400).send(`Webhook JSON Parse Error: ${jsonErr.message}`);
      }
    } else {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  if (event.type === "checkout.session.completed") {
    createCardOrder(event.data.object || event.data);
  }

  res.status(200).json({ received: true });
});
