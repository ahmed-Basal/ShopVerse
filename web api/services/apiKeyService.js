const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const factory = require("./handlersFactory");
const ApiKey = require("../models/apiKeyModel");

// @desc    Create new API key
// @route   POST /api/v1/apikeys
// @access  Protected (User/Manager/Admin)
exports.createApiKey = asyncHandler(async (req, res, next) => {
  const generatedKey = `api_key_${crypto.randomBytes(24).toString("hex")}`;
  
  const apiKey = await ApiKey.create({
    key: generatedKey,
    name: req.body.name,
    user: req.user._id,
    permissions: req.body.permissions,
    expiresAt: req.body.expiresAt,
  });

  res.status(201).json({ data: apiKey });
});

// Helper middleware to filter API keys by current logged-in user
exports.createFilterObj = (req, res, next) => {
  req.filterObj = { user: req.user._id };
  next();
};

// @desc    Get list of my API keys
// @route   GET /api/v1/apikeys
// @access  Protected (User/Manager/Admin)
exports.getMyApiKeys = [
  exports.createFilterObj,
  factory.getAll(ApiKey)
];

// @desc    Delete/Revoke API key
// @route   DELETE /api/v1/apikeys/:id
// @access  Protected (User/Manager/Admin)
exports.deleteApiKey = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const apiKey = await ApiKey.findOneAndDelete({ _id: id, user: req.user._id });

  if (!apiKey) {
    return next(
      new ApiError(`No API Key found with ID ${id} associated with your account`, 404)
    );
  }

  res.status(204).send();
});
