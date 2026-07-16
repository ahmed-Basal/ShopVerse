const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");

const factory = require("./handlersFactory");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const SubCategory = require("../models/subcategoryModel");

// Multer upload middleware
exports.uploadSubCategoryImage = uploadSingleImage("image");

// Image processing middleware
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `subcategory-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {
    // Create subcategories folder in uploads if it doesn't exist
    const fs = require("fs");
    if (!fs.existsSync("uploads/subcategories")) {
      fs.mkdirSync("uploads/subcategories", { recursive: true });
    }

    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/subcategories/${filename}`);

    req.body.image = filename;
  }

  next();
});

// Middleware to build filter for nested routes (e.g. GET /categories/:categoryId/subcategories)
exports.createFilterObj = (req, res, next) => {
  let filterObj = {};
  if (req.params.categoryId) {
    filterObj = { category: req.params.categoryId };
  }
  // Check if filtering directly by category query param is supplied (e.g. GET /subcategories?category=...)
  if (req.query.category) {
    filterObj = { category: req.query.category };
  }
  req.filterObj = filterObj;
  next();
};

// Middleware to associate categoryId from request params to request body (e.g. POST /categories/:categoryId/subcategories)
exports.setCategoryIdToBody = (req, res, next) => {
  if (!req.body.category) req.body.category = req.params.categoryId;
  next();
};

// CRUD handlers
exports.getSubCategories = factory.getAll(SubCategory);
exports.getSubCategory = factory.getOne(SubCategory);
exports.createSubCategory = factory.createOne(SubCategory);
exports.updateSubCategory = factory.updateOne(SubCategory);
exports.deleteSubCategory = factory.deleteOne(SubCategory);
