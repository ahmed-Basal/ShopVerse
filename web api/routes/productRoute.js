const express = require("express");
const {
  getProductValidator,
  createProductValidator,
  updateProductValidator,
  deleteProductValidator,
} = require("../utils/validators/productValidator");

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  resizeProductImages,
  applyProductCoupon,
} = require("../services/productService");
const authService = require("../services/authService");
const reviewsRoute = require("./reviewRoute");

const router = express.Router();

router.use("/:productId/reviews", reviewsRoute);

router
  .route("/")
  .get(getProducts)
  .post(
    authService.protectOrApiKey,
    authService.allowedTo("admin"),
    uploadProductImages,
    resizeProductImages,
    createProductValidator,
    createProduct,
  );
router
  .route("/:id")
  .get(getProductValidator, getProduct)
  .put(
    authService.protectOrApiKey,
    authService.allowedTo("admin"),
    uploadProductImages,
    resizeProductImages,
    updateProductValidator,
    updateProduct,
  )
  .delete(
    authService.protectOrApiKey,
    authService.allowedTo("admin"),
    deleteProductValidator,
    deleteProduct,
  );

router.post(
  "/:id/apply-coupon",
  authService.protectOrApiKey,
  authService.allowedTo("user"),
  applyProductCoupon
);

module.exports = router;
