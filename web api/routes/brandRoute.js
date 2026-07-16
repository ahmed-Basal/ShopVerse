const express = require("express");
const {
  getBrandValidator,
  createBrandValidator,
  updateBrandValidator,
  deleteBrandValidator,
} = require("../utils/validators/brandValidator");

const authService = require("../services/authService");

const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  uploadBrandImage,
  resizeImage,
} = require("../services/brandService");

const router = express.Router();

router
  .route("/")
  .get(getBrands)
  .post(
    authService.protectOrApiKey,
    authService.allowedTo("admin", "manager"),
    uploadBrandImage,
    resizeImage,
    createBrandValidator,
    createBrand,
  );
router
  .route("/:id")
  .get(getBrandValidator, getBrand)
  .put(
    authService.protectOrApiKey,
    authService.allowedTo("admin", "manager"),
    uploadBrandImage,
    resizeImage,
    updateBrandValidator,
    updateBrand,
  )
  .delete(
    authService.protectOrApiKey,
    authService.allowedTo("admin"),
    deleteBrandValidator,
    deleteBrand,
  );

module.exports = router;
