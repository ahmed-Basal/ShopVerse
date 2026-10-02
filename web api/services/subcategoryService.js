const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const ApiError = require("../utils/apiError");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const prisma = require("../config/prismaClient");

const buildImageUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith("http") || filename.startsWith("data:")) return filename;
  return `${process.env.BASE_URL || "http://localhost:8000"}/subcategories/${filename}`;
};

exports.uploadSubCategoryImage = uploadSingleImage("image");

exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `subcategory-${uuidv4()}-${Date.now()}.jpeg`;
  if (req.file) {
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/subcategories/${filename}`);
    req.body.image = filename;
  }
  next();
});

// Middleware: filter subcategories by category
exports.setCategoryIdToBody = (req, res, next) => {
  if (!req.body.categoryId) req.body.categoryId = req.params.categoryId;
  next();
};

exports.createFilterObj = (req, res, next) => {
  if (req.params.categoryId) req.filterObj = { categoryId: req.params.categoryId };
  next();
};

exports.getSubCategories = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  const where = req.filterObj || {};

  const [total, subcategories] = await Promise.all([
    prisma.subCategory.count({ where }),
    prisma.subCategory.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        products: {
          take: 20,
          select: { id: true, title: true, price: true, imageCover: true },
        },
      },
    }),
  ]);

  const paginationResult = { currentPage: page, limit, numberOfPages: Math.ceil(total / limit) };
  res.status(200).json({
    results: subcategories.length,
    paginationResult,
    data: subcategories.map((s) => ({ ...s, image: buildImageUrl(s.image) })),
  });
});

exports.getSubCategory = asyncHandler(async (req, res, next) => {
  const subcategory = await prisma.subCategory.findUnique({
    where: { id: req.params.id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      products: {
        select: { id: true, title: true, price: true, imageCover: true, ratingsAverage: true },
      },
    },
  });
  if (!subcategory) return next(new ApiError(`No subcategory for this id ${req.params.id}`, 404));
  res.status(200).json({ data: { ...subcategory, image: buildImageUrl(subcategory.image) } });
});

exports.createSubCategory = asyncHandler(async (req, res) => {
  const sub = await prisma.subCategory.create({
    data: {
      name: req.body.name,
      slug: req.body.slug || req.body.name?.toLowerCase().replace(/\s+/g, "-"),
      description: req.body.description || null,
      image: req.body.image || null,
      categoryId: req.body.categoryId || req.body.category,
    },
    include: { category: { select: { name: true } } },
  });
  res.status(201).json({ data: { ...sub, image: buildImageUrl(sub.image) } });
});

exports.updateSubCategory = asyncHandler(async (req, res, next) => {
  try {
    const sub = await prisma.subCategory.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description,
        image: req.body.image,
        categoryId: req.body.categoryId || req.body.category,
      },
    });
    res.status(200).json({ data: { ...sub, image: buildImageUrl(sub.image) } });
  } catch (err) {
    if (err.code === "P2025") return next(new ApiError(`No subcategory for this id ${req.params.id}`, 404));
    throw err;
  }
});

exports.deleteSubCategory = asyncHandler(async (req, res, next) => {
  try {
    await prisma.subCategory.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return next(new ApiError(`No subcategory for this id ${req.params.id}`, 404));
    throw err;
  }
});
