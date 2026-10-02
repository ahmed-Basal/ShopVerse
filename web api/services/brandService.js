const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const ApiError = require("../utils/apiError");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const prisma = require("../config/prismaClient");

const buildImageUrl = (filename, folder = "brands") => {
  if (!filename) return null;
  if (filename.startsWith("http") || filename.startsWith("data:")) return filename;
  return `${process.env.BASE_URL || "http://localhost:8000"}/${folder}/${filename}`;
};

exports.uploadBrandImage = uploadSingleImage("image");

exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `brand-${uuidv4()}-${Date.now()}.jpeg`;
  if (req.file) {
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/brands/${filename}`);
    req.body.image = filename;
  }
  next();
});

exports.getBrands = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const [total, brands] = await Promise.all([
    prisma.brand.count(),
    prisma.brand.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
  ]);

  const paginationResult = { currentPage: page, limit, numberOfPages: Math.ceil(total / limit) };
  res.status(200).json({
    results: brands.length,
    paginationResult,
    data: brands.map((b) => ({ ...b, image: buildImageUrl(b.image) })),
  });
});

exports.getBrand = asyncHandler(async (req, res, next) => {
  const brand = await prisma.brand.findUnique({ where: { id: req.params.id } });
  if (!brand) return next(new ApiError(`No brand for this id ${req.params.id}`, 404));
  res.status(200).json({ data: { ...brand, image: buildImageUrl(brand.image) } });
});

exports.createBrand = asyncHandler(async (req, res) => {
  const brand = await prisma.brand.create({
    data: {
      name: req.body.name,
      slug: req.body.slug || req.body.name?.toLowerCase().replace(/\s+/g, "-"),
      image: req.body.image || null,
    },
  });
  res.status(201).json({ data: { ...brand, image: buildImageUrl(brand.image) } });
});

exports.updateBrand = asyncHandler(async (req, res, next) => {
  try {
    const brand = await prisma.brand.update({
      where: { id: req.params.id },
      data: { name: req.body.name, slug: req.body.slug, image: req.body.image },
    });
    res.status(200).json({ data: { ...brand, image: buildImageUrl(brand.image) } });
  } catch (err) {
    if (err.code === "P2025") return next(new ApiError(`No brand for this id ${req.params.id}`, 404));
    throw err;
  }
});

exports.deleteBrand = asyncHandler(async (req, res, next) => {
  try {
    await prisma.brand.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return next(new ApiError(`No brand for this id ${req.params.id}`, 404));
    throw err;
  }
});
