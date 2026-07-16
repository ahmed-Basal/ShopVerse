const express = require("express");

const {
  createReviewValidator,
  updateReviewValidator,
  getReviewValidator,
  deleteReviewValidator,
} = require("../utils/validators/reviewValidator");

const {
  getReview,
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  createFilterObj,
  setProductIdAndUserIdToBody,
} = require("../services/reviewService");

const authService = require("../services/authService");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(createFilterObj, getReviews)
  .post(
    authService.protectOrApiKey,
    authService.allowedTo("user"),
    setProductIdAndUserIdToBody,
    createReviewValidator,
    createReview,
  );
router
  .route("/:id")
  .get(getReviewValidator, getReview)
  .put(
    authService.protectOrApiKey,
    authService.allowedTo("user"),
    updateReviewValidator,
    updateReview,
  )
  .delete(
    authService.protectOrApiKey,
    authService.allowedTo("user", "manager", "admin"),
    deleteReviewValidator,
    deleteReview,
  );

module.exports = router;
