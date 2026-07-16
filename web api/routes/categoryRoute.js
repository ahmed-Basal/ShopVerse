const express = require("express");

const {
  getCategoryValidator,
  createCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
} = require("../utils/validators/categoryValidator");

const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  resizeImage,
} = require("../services/categoryService");

const authService = require("../services/authService");
const subCategoryRoute = require("./subCategoryRoute");

const router = express.Router();

// Nested route
router.use("/:categoryId/subcategories", subCategoryRoute);

router
  .route("/")
  .get(getCategories)
  .post(
    authService.protectOrApiKey,
    authService.allowedTo("admin", "manager"),
    uploadCategoryImage,
    resizeImage,
    createCategoryValidator,
    createCategory,
  );
router
  .route("/:id")
  .get(getCategoryValidator, getCategory)
  .put(
    authService.protectOrApiKey,
    authService.allowedTo("admin", "manager"),
    uploadCategoryImage,
    resizeImage,
    updateCategoryValidator,
    updateCategory,
  )
  .delete(
    authService.protectOrApiKey,
    authService.allowedTo("admin"),
    deleteCategoryValidator,
    deleteCategory,
  );

module.exports = router;
