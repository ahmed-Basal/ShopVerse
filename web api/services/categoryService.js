const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");

const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const ApiError = require("../utils/apiError");
const prisma = require("../config/prismaClient");

exports.uploadCategoryImage = uploadSingleImage("image");

exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `category-${uuidv4()}-${Date.now()}.jpeg`;
  if (req.file) {
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/categories/${filename}`);
    req.body.image = filename;
  }
  next();
});

// Helper to build image URL
const buildImageUrl = (filename, folder = "categories") => {
  if (!filename) return null;
  if (filename.startsWith("http") || filename.startsWith("data:")) return filename;
  return `${process.env.BASE_URL || "http://localhost:8000"}/${folder}/${filename}`;
};

exports.getCategories = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  let where = {};
  if (req.filterObj) where = { ...req.filterObj };

  // Filter by type (name match)
  if (req.query.type) {
    const category = await prisma.category.findFirst({
      where: { name: { equals: req.query.type, mode: "insensitive" } },
    });
    if (!category) {
      return res.status(200).json({ status: "success", categories: [], data: [] });
    }
    return res.status(200).json({ status: "success", data: [{ ...category, image: buildImageUrl(category.image) }] });
  }

  const [total, categories] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        subcategories: true,
      },
    }),
  ]);

  const withUrls = categories.map((cat) => ({
    ...cat,
    image: buildImageUrl(cat.image),
    subcategories: (cat.subcategories || []).map((sub) => ({
      ...sub,
      image: buildImageUrl(sub.image, "subcategories"),
    })),
  }));
  const categoryNames = categories.map((cat) => cat.name.toLowerCase());

  const paginationResult = {
    currentPage: page,
    limit,
    numberOfPages: Math.ceil(total / limit),
    totalCount: total,
  };
  if (page * limit < total) paginationResult.next = page + 1;
  if (skip > 0) paginationResult.prev = page - 1;

  res.status(200).json({
    status: "success",
    results: categories.length,
    paginationResult,
    categories: categoryNames,
    data: withUrls,
  });
});

exports.getCategory = asyncHandler(async (req, res, next) => {
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: {
      subcategories: true,
      products: {
        take: 50,
        include: {
          subCategory: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!category) return next(new ApiError(`No category for this id ${req.params.id}`, 404));
  res.status(200).json({
    data: {
      ...category,
      image: buildImageUrl(category.image),
      subcategories: (category.subcategories || []).map((sub) => ({
        ...sub,
        image: buildImageUrl(sub.image, "subcategories"),
      })),
    },
  });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const category = await prisma.category.create({
    data: {
      name: req.body.name,
      slug: req.body.slug || req.body.name?.toLowerCase().replace(/\s+/g, "-"),
      image: req.body.image || null,
    },
  });
  res.status(201).json({ data: { ...category, image: buildImageUrl(category.image) } });
});

exports.updateCategory = asyncHandler(async (req, res, next) => {
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        slug: req.body.slug,
        image: req.body.image,
      },
    });
    res.status(200).json({ data: { ...category, image: buildImageUrl(category.image) } });
  } catch (err) {
    if (err.code === "P2025") return next(new ApiError(`No category for this id ${req.params.id}`, 404));
    throw err;
  }
});

exports.deleteCategory = asyncHandler(async (req, res, next) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return next(new ApiError(`No category for this id ${req.params.id}`, 404));
    throw err;
  }
});
