const express = require("express");
const { uploadFileMiddleware, uploadImage } = require("../services/uploadService");
const authService = require("../services/authService");

const router = express.Router();

router.post(
  "/",
  authService.protectOrApiKey,
  uploadFileMiddleware,
  uploadImage
);

module.exports = router;
