const express = require("express");

const {
  createSubCategoryValidator,
  getSubCategoryValidator,
  updateSubCategoryValidator,
  deleteSubCategoryValidator,
} = require("../utils/validators/subcategoryValidator");

const {
  createSubCategory,
  getSubCategories,
  getSubCategory,
  updateSubCategory,
  deleteSubCategory,
  setCategoryIdToBody,
  createFilterObj,
  uploadSubCategoryImage,
  resizeImage,
} = require("../services/subcategoryService");

const authService = require("../services/authService");

// Allow mergeParams to support nested routes (e.g. /api/v1/categories/:categoryId/subcategories)
const router = express.Router({ mergeParams: true });

router
  .route("/")
  .post(
    authService.protectOrApiKey,
    authService.allowedTo("admin", "manager"),
    uploadSubCategoryImage,
    resizeImage,
    setCategoryIdToBody,
    createSubCategoryValidator,
    createSubCategory
  )
  .get(createFilterObj, getSubCategories);

router
  .route("/:id")
  .get(getSubCategoryValidator, getSubCategory)
  .put(
    authService.protectOrApiKey,
    authService.allowedTo("admin", "manager"),
    uploadSubCategoryImage,
    resizeImage,
    updateSubCategoryValidator,
    updateSubCategory
  )
  .delete(
    authService.protectOrApiKey,
    authService.allowedTo("admin"),
    deleteSubCategoryValidator,
    deleteSubCategory
  );

module.exports = router;
