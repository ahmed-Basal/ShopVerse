const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const prisma = require("../config/prismaClient");

exports.getCoupons = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const [total, coupons] = await Promise.all([
    prisma.coupon.count(),
    prisma.coupon.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
  ]);

  const paginationResult = { currentPage: page, limit, numberOfPages: Math.ceil(total / limit) };
  res.status(200).json({ results: coupons.length, paginationResult, data: coupons });
});

exports.getCoupon = asyncHandler(async (req, res, next) => {
  const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!coupon) return next(new ApiError(`No coupon for this id ${req.params.id}`, 404));
  res.status(200).json({ data: coupon });
});

exports.createCoupon = asyncHandler(async (req, res) => {
  const coupon = await prisma.coupon.create({
    data: {
      name: req.body.name,
      expire: new Date(req.body.expire),
      discount: parseFloat(req.body.discount),
    },
  });
  res.status(201).json({ data: coupon });
});

exports.updateCoupon = asyncHandler(async (req, res, next) => {
  try {
    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        expire: req.body.expire ? new Date(req.body.expire) : undefined,
        discount: req.body.discount ? parseFloat(req.body.discount) : undefined,
      },
    });
    res.status(200).json({ data: coupon });
  } catch (err) {
    if (err.code === "P2025") return next(new ApiError(`No coupon for this id ${req.params.id}`, 404));
    throw err;
  }
});

exports.deleteCoupon = asyncHandler(async (req, res, next) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return next(new ApiError(`No coupon for this id ${req.params.id}`, 404));
    throw err;
  }
});
