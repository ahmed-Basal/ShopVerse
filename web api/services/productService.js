const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");

const { uploadMixOfImages } = require("../middlewares/uploadImageMiddleware");
const factory = require("./handlersFactory");
const ApiError = require("../utils/apiError");
const prisma = require("../config/prismaClient");

exports.uploadProductImages = uploadMixOfImages([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 5 },
]);

exports.resizeProductImages = asyncHandler(async (req, res, next) => {
  // Fix: convert single color value (from FormData) into an array
  if (req.body.colors && !Array.isArray(req.body.colors)) {
    req.body.colors = [req.body.colors];
  }

  // Support link URLs in images field
  if (req.body.images) {
    if (typeof req.body.images === "string") {
      try {
        const parsed = JSON.parse(req.body.images);
        req.body.images = Array.isArray(parsed) ? parsed : [req.body.images];
      } catch {
        req.body.images = req.body.images.split(",").map((s) => s.trim()).filter(Boolean);
      }
    } else if (!Array.isArray(req.body.images)) {
      req.body.images = [req.body.images];
    }
  }

  if (!req.files) return next();

  if (req.files.imageCover && req.files.imageCover.length > 0) {
    const imageCoverFileName = `product-${uuidv4()}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/products/${imageCoverFileName}`);
    req.body.imageCover = imageCoverFileName;
  }

  if (req.files.images && req.files.images.length > 0) {
    const uploadedImages = await Promise.all(
      req.files.images.map(async (img, index) => {
        const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;
        await sharp(img.buffer)
          .resize(2000, 1333)
          .toFormat("jpeg")
          .jpeg({ quality: 95 })
          .toFile(`uploads/products/${imageName}`);
        return imageName;
      })
    );
    req.body.images = (req.body.images || []).concat(uploadedImages);
  }

  next();
});

// Helper to build full image URL
const buildImageUrl = (filename) => {
  if (!filename) return "";
  if (filename.startsWith("http") || filename.startsWith("data:")) return filename;
  const baseUrl = process.env.BASE_URL || "http://localhost:8000";
  return `${baseUrl}/products/${filename}`;
};

// Helper to map DB product to frontend format
const getEntityName = (entity, defaultVal = "") => {
  if (!entity) return defaultVal;
  if (typeof entity === "object" && entity.name) return entity.name;
  if (typeof entity === "string") return entity;
  return defaultVal;
};

const mapProductToFrontend = (prod) => {
  const categoryName = getEntityName(prod.category, "General");
  const subCategoryName = getEntityName(prod.subCategory, null);
  const brandName = getEntityName(prod.brand, "Generic");

  const imageCover = buildImageUrl(prod.imageCover);
  const images = (prod.images || []).map(buildImageUrl);

  return {
    id: prod.id,
    _id: prod.id,
    title: prod.title,
    price: prod.price,
    description: prod.description || "",
    image: imageCover,
    imageCover,
    images: images.length > 0 ? images : [imageCover],
    brand: brandName,
    brandId: prod.brandId || null,
    brandObj: prod.brand || null,
    model: prod.slug || "standard",
    color: prod.colors && prod.colors.length > 0 ? prod.colors[0] : "Default",
    category: categoryName.toLowerCase(),
    categoryName,
    categoryId: prod.categoryId || null,
    categoryObj: prod.category || null,
    subCategory: subCategoryName,
    subCategoryId: prod.subCategoryId || null,
    subCategoryObj: prod.subCategory || null,
    discount: prod.priceAfterDiscount
      ? Math.round(((prod.price - prod.priceAfterDiscount) / prod.price) * 100)
      : 10,
    priceAfterDiscount: prod.priceAfterDiscount || null,
    quantity: prod.quantity || 0,
    sold: prod.sold || 0,
    popular: (prod.sold || 0) > 25,
    isAddedToCart: false,
    ratingsAverage: prod.ratingsAverage || 4.5,
    ratingsQuantity: prod.ratingsQuantity || 0,
    reviews: prod.reviews || [],
  };
};

exports.getProducts = asyncHandler(async (req, res) => {
  if (req.query.pageNumber) req.query.page = req.query.pageNumber;
  if (req.query.pageSize) req.query.limit = req.query.pageSize;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  let where = {};
  if (req.filterObj) where = { ...req.filterObj };

  // Support filtering by categoryName
  const { categoryName, keyword } = req.query;
  if (categoryName) {
    const cat = await prisma.category.findFirst({
      where: { name: { equals: categoryName, mode: "insensitive" } },
    });
    if (cat) {
      where.categoryId = cat.id;
    } else {
      return res.status(200).json({ status: "success", products: [], data: [] });
    }
  }

  // Keyword search
  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: "insensitive" } },
      { description: { contains: keyword, mode: "insensitive" } },
    ];
  }

  // Dynamic sort parameter
  const sortMap = {
    'price': { price: 'asc' },
    '-price': { price: 'desc' },
    'rating': { ratingsAverage: 'desc' },
    '-rating': { ratingsAverage: 'desc' },
    'newest': { createdAt: 'desc' },
    '-createdAt': { createdAt: 'desc' },
    'oldest': { createdAt: 'asc' },
    'popular': { sold: 'desc' },
    'name': { title: 'asc' },
  };
  const orderBy = (req.query.sort && sortMap[req.query.sort]) ? sortMap[req.query.sort] : { createdAt: 'desc' };

  // Filter by categoryId, brandId, subCategoryId, minPrice, maxPrice
  if (req.query.categoryId) where.categoryId = req.query.categoryId;
  if (req.query.brandId) where.brandId = req.query.brandId;
  if (req.query.subCategoryId) where.subCategoryId = req.query.subCategoryId;
  if (req.query.subCategory) {
    const sub = await prisma.subCategory.findFirst({
      where: { name: { equals: req.query.subCategory, mode: "insensitive" } },
    });
    if (sub) {
      where.subCategoryId = sub.id;
    } else {
      return res.status(200).json({ status: "success", products: [], data: [] });
    }
  }
  if (req.query.minPrice || req.query.maxPrice) {
    where.price = {};
    if (req.query.minPrice) where.price.gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) where.price.lte = parseFloat(req.query.maxPrice);
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        subCategory: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
      },
    }),
  ]);

  const paginationResult = {
    currentPage: page,
    limit,
    numberOfPages: Math.ceil(total / limit),
    totalCount: total,
    totalPages: Math.ceil(total / limit),
  };
  if (page * limit < total) paginationResult.next = page + 1;
  if (skip > 0) paginationResult.prev = page - 1;

  const mappedProducts = products.map(mapProductToFrontend);

  res.status(200).json({
    status: "success",
    message: "Products fetched successfully",
    results: mappedProducts.length,
    paginationResult,
    products: mappedProducts,
    data: mappedProducts,
  });
});

exports.getProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      subCategory: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
      reviews: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  if (!product) {
    return next(new ApiError(`No product found for ID ${id}`, 404));
  }

  const mapped = mapProductToFrontend(product);
  res.status(200).json({
    status: "success",
    product: mapped,
    data: mapped,
  });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const data = {
    title: req.body.title,
    slug: req.body.slug || req.body.title?.toLowerCase().replace(/\s+/g, "-"),
    description: req.body.description,
    quantity: parseInt(req.body.quantity),
    price: parseFloat(req.body.price),
    priceAfterDiscount: req.body.priceAfterDiscount ? parseFloat(req.body.priceAfterDiscount) : null,
    colors: req.body.colors || [],
    imageCover: req.body.imageCover || "",
    images: req.body.images || [],
    categoryId: req.body.category || req.body.categoryId || null,
    subCategoryId: req.body.subCategory || req.body.subCategoryId || null,
    brandId: req.body.brand || req.body.brandId || null,
  };

  const product = await prisma.product.create({
    data,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      subCategory: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
    },
  });
  res.status(201).json({ data: mapProductToFrontend(product) });
});

exports.updateProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = {};
  if (req.body.title !== undefined) updateData.title = req.body.title;
  if (req.body.slug !== undefined) updateData.slug = req.body.slug;
  if (req.body.description !== undefined) updateData.description = req.body.description;
  if (req.body.quantity !== undefined) updateData.quantity = parseInt(req.body.quantity);
  if (req.body.price !== undefined) updateData.price = parseFloat(req.body.price);
  if (req.body.priceAfterDiscount !== undefined)
    updateData.priceAfterDiscount = parseFloat(req.body.priceAfterDiscount);
  if (req.body.colors !== undefined) updateData.colors = req.body.colors;
  if (req.body.imageCover !== undefined) updateData.imageCover = req.body.imageCover;
  if (req.body.images !== undefined) updateData.images = req.body.images;
  if (req.body.category !== undefined) updateData.categoryId = req.body.category;
  if (req.body.categoryId !== undefined) updateData.categoryId = req.body.categoryId;
  if (req.body.subCategory !== undefined) updateData.subCategoryId = req.body.subCategory;
  if (req.body.subCategoryId !== undefined) updateData.subCategoryId = req.body.subCategoryId;
  if (req.body.brand !== undefined) updateData.brandId = req.body.brand;
  if (req.body.brandId !== undefined) updateData.brandId = req.body.brandId;

  try {
    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        subCategory: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
      },
    });
    res.status(200).json({ data: mapProductToFrontend(product) });
  } catch (err) {
    if (err.code === "P2025") {
      return next(new ApiError(`No product found for id ${id}`, 404));
    }
    throw err;
  }
});

exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  try {
    await prisma.product.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return next(new ApiError(`No product found for id ${id}`, 404));
    }
    throw err;
  }
});

exports.applyProductCoupon = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { couponCode } = req.body;

  if (!couponCode) {
    return res.status(400).json({ status: "fail", message: "Please provide a coupon code" });
  }

  const coupon = await prisma.coupon.findFirst({
    where: { name: couponCode, expire: { gt: new Date() } },
  });

  if (!coupon) {
    return res.status(400).json({ status: "fail", message: "Coupon is invalid or expired" });
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return res.status(404).json({ status: "fail", message: "Product not found" });
  }

  const discountedPrice = (product.price - (product.price * coupon.discount) / 100).toFixed(2);

  res.status(200).json({
    status: "success",
    originalPrice: product.price,
    discountedPrice: parseFloat(discountedPrice),
    discount: coupon.discount,
  });
});
