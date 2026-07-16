const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");

const { uploadMixOfImages } = require("../middlewares/uploadImageMiddleware");
const factory = require("./handlersFactory");
const Product = require("../models/productModel");
const Coupon = require("../models/couponModel");


exports.uploadProductImages = uploadMixOfImages([
  {
    name: "imageCover",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 5,
  },
]);
exports.resizeProductImages = asyncHandler(async (req, res, next) => {
  // Fix: convert single color value (from FormData) into an array
  if (req.body.colors && !Array.isArray(req.body.colors)) {
    req.body.colors = [req.body.colors];
  }

  if (!req.files) {
    return next();
  }

  if (req.files.imageCover) {
    const imageCoverFileName = `product-${uuidv4()}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/products/${imageCoverFileName}`);

    req.body.imageCover = imageCoverFileName;
  }

  if (req.files.images) {
    req.body.images = await Promise.all(
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
  }

  next();
});
const ApiFeatures = require("../utils/apiFeatures");
const Category = require("../models/categoryModel");

// Helper to map DB product to frontend format
const mapProductToFrontend = (prod) => {
  const categoryName =
    prod.category && typeof prod.category === "object" && prod.category.name
      ? prod.category.name
      : prod.category
      ? prod.category.toString()
      : "general";

  const brandName =
    prod.brand && typeof prod.brand === "object" && prod.brand.name
      ? prod.brand.name
      : prod.brand
      ? prod.brand.toString()
      : "Generic";

  return {
    id: prod._id.toString(),
    title: prod.title,
    price: prod.price,
    description: prod.description || "",
    image: prod.imageCover || "",
    brand: brandName,
    model: prod.slug || "standard",
    color: prod.colors && prod.colors.length > 0 ? prod.colors[0] : "Default",
    category: categoryName.toLowerCase(),
    discount: prod.priceAfterDiscount
      ? Math.round(((prod.price - prod.priceAfterDiscount) / prod.price) * 100)
      : 10,
    popular: (prod.sold || 0) > 25,
    isAddedToCart: false,
  };
};

exports.getProducts = asyncHandler(async (req, res) => {
  // Support pagination aliases
  if (req.query.pageNumber) {
    req.query.page = req.query.pageNumber;
  }
  if (req.query.pageSize) {
    req.query.limit = req.query.pageSize;
  }

  let filter = {};
  if (req.filterObj) {
    filter = req.filterObj;
  }

  // Support filtering by categoryName directly in the backend
  const { categoryName } = req.query;
  if (categoryName) {
    const categoryDoc = await Category.findOne({
      name: { $regex: new RegExp(`^${categoryName}$`, "i") },
    });
    if (categoryDoc) {
      filter.category = categoryDoc._id;
    } else {
      return res.status(200).json({
        status: "success",
        products: [],
        data: []
      });
    }
  }

  const documentsCounts = await Product.countDocuments(filter);
  const apiFeatures = new ApiFeatures(Product.find(filter), req.query)
    .paginate(documentsCounts)
    .filter()
    .search("Products")
    .limitFields()
    .sort();

  const { mongooseQuery, paginationResult } = apiFeatures;
  const products = await mongooseQuery
    .populate({
      path: "category",
      select: "name",
    })
    .populate({
      path: "brand",
      select: "name",
    });

  const mappedProducts = products.map(mapProductToFrontend);

  // Enhance pagination metadata
  if (paginationResult) {
    paginationResult.totalCount = documentsCounts;
    paginationResult.totalPages = Math.ceil(documentsCounts / (req.query.limit * 1 || 50));
  }

  res.status(200).json({
    status: "success",
    message: "Products fetched successfully",
    results: mappedProducts.length,
    paginationResult,
    products: mappedProducts,
    data: products,
  });
});

exports.getProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const product = await Product.findById(id)
    .populate({
      path: "category",
      select: "name",
    })
    .populate({
      path: "brand",
      select: "name",
    })
    .populate("reviews");

  if (!product) {
    return next(new ApiError(`No product found for ID ${id}`, 404));
  }

  res.status(200).json({
    status: "success",
    product: mapProductToFrontend(product),
    data: product,
  });
});

exports.createProduct = factory.createOne(Product);

exports.updateProduct = factory.updateOne(Product);

exports.deleteProduct = factory.deleteOne(Product);

exports.applyProductCoupon = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { couponCode } = req.body;

  if (!couponCode) {
    return res.status(400).json({
      status: "fail",
      message: "Please provide a coupon code",
    });
  }

  const coupon = await Coupon.findOne({
    name: couponCode,
    expire: { $gt: Date.now() },
  });

  if (!coupon) {
    return res.status(400).json({
      status: "fail",
      message: "Coupon is invalid or expired",
    });
  }

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({
      status: "fail",
      message: "Product not found",
    });
  }

  const discountedPrice = (
    product.price -
    (product.price * coupon.discount) / 100
  ).toFixed(2);

  res.status(200).json({
    status: "success",
    originalPrice: product.price,
    discountedPrice: parseFloat(discountedPrice),
    discount: coupon.discount,
  });
});
