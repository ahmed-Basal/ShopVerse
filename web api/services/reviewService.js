const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const prisma = require("../config/prismaClient");

exports.createReview = asyncHandler(async (req, res, next) => {
  const review = await prisma.review.create({
    data: {
      title: req.body.title,
      ratings: parseFloat(req.body.ratings),
      userId: req.user.id,
      productId: req.params.productId || req.body.productId,
    },
    include: { user: { select: { name: true } } },
  });

  // Recalculate average ratings
  await updateProductRatings(review.productId);

  res.status(201).json({ data: review });
});

exports.getReviews = asyncHandler(async (req, res) => {
  const where = req.params.productId ? { productId: req.params.productId } : {};
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
  ]);

  const paginationResult = { currentPage: page, limit, numberOfPages: Math.ceil(total / limit) };
  res.status(200).json({ results: reviews.length, paginationResult, data: reviews });
});

exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await prisma.review.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { name: true } } },
  });
  if (!review) return next(new ApiError(`No review for this id ${req.params.id}`, 404));
  res.status(200).json({ data: review });
});

exports.updateReview = asyncHandler(async (req, res, next) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: {
        title: req.body.title,
        ratings: req.body.ratings ? parseFloat(req.body.ratings) : undefined,
      },
      include: { user: { select: { name: true } } },
    });
    await updateProductRatings(review.productId);
    res.status(200).json({ data: review });
  } catch (err) {
    if (err.code === "P2025") return next(new ApiError(`No review for this id ${req.params.id}`, 404));
    throw err;
  }
});

exports.deleteReview = asyncHandler(async (req, res, next) => {
  try {
    const review = await prisma.review.delete({ where: { id: req.params.id } });
    await updateProductRatings(review.productId);
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return next(new ApiError(`No review for this id ${req.params.id}`, 404));
    throw err;
  }
});

// Middleware to set productId from params
exports.setProductIdToBody = (req, res, next) => {
  if (!req.body.productId) req.body.productId = req.params.productId;
  next();
};

// Middleware to filter reviews by product
exports.createFilterObj = (req, res, next) => {
  if (req.params.productId) req.filterObj = { productId: req.params.productId };
  next();
};

// Helper: recalculate product ratings
const updateProductRatings = async (productId) => {
  const result = await prisma.review.aggregate({
    where: { productId },
    _avg: { ratings: true },
    _count: { ratings: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingsAverage: result._avg.ratings || 0,
      ratingsQuantity: result._count.ratings || 0,
    },
  });
};
