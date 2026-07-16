const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");

const factory = require("./handlersFactory");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const Category = require("../models/categoryModel");

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

const ApiFeatures = require("../utils/apiFeatures");

exports.getCategories = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.filterObj) {
    filter = req.filterObj;
  }

  const { type } = req.query;

  if (type) {
    const categoryDoc = await Category.findOne({
      name: { $regex: new RegExp(`^${type}$`, "i") },
    });

    if (!categoryDoc) {
      return res.status(200).json({ status: "success", categories: [], data: [] });
    }

    return res.status(200).json({ status: "success", data: [categoryDoc] });
  }

  const documentsCounts = await Category.countDocuments(filter);
  const apiFeatures = new ApiFeatures(Category.find(filter), req.query)
    .paginate(documentsCounts)
    .filter()
    .sort()
    .limitFields();

  const { mongooseQuery, paginationResult } = apiFeatures;
  const categories = await mongooseQuery;

  const categoryNames = categories.map((cat) => cat.name.toLowerCase());

  res.status(200).json({
    status: "success",
    results: categories.length,
    paginationResult,
    categories: categoryNames,
    data: categories,
  });
});

exports.getCategory = factory.getOne(Category);

exports.createCategory = factory.createOne(Category);

exports.updateCategory = factory.updateOne(Category);

exports.deleteCategory = factory.deleteOne(Category);
