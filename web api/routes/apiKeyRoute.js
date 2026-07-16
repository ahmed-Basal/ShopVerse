const express = require("express");
const {
  createApiKeyValidator,
  deleteApiKeyValidator,
} = require("../utils/validators/apiKeyValidator");

const authService = require("../services/authService");

const {
  createApiKey,
  getMyApiKeys,
  deleteApiKey,
} = require("../services/apiKeyService");

const router = express.Router();

// Require JWT protect for all API Key management endpoints
router.use(authService.protect);

router
  .route("/")
  .post(createApiKeyValidator, createApiKey)
  .get(getMyApiKeys);

router.route("/:id").delete(deleteApiKeyValidator, deleteApiKey);

module.exports = router;
