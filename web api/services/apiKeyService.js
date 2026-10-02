const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const prisma = require("../config/prismaClient");

// @desc    Create new API key
exports.createApiKey = asyncHandler(async (req, res, next) => {
  const generatedKey = `api_key_${crypto.randomBytes(24).toString("hex")}`;

  const apiKey = await prisma.apiKey.create({
    data: {
      key: generatedKey,
      name: req.body.name,
      userId: req.user.id,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
      permissions: req.body.permissions
        ? {
            create: req.body.permissions.map((p) => ({
              route: p.route,
              methods: p.methods || ["*"],
            })),
          }
        : undefined,
    },
    include: { permissions: true },
  });

  res.status(201).json({ data: apiKey });
});

// Middleware: filter API keys by current user
exports.createFilterObj = (req, res, next) => {
  req.filterObj = { userId: req.user.id };
  next();
};

// @desc    Get list of my API keys
exports.getMyApiKeys = [
  exports.createFilterObj,
  asyncHandler(async (req, res) => {
    const apiKeys = await prisma.apiKey.findMany({
      where: req.filterObj,
      include: { permissions: true },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ results: apiKeys.length, data: apiKeys });
  }),
];

// @desc    Delete/Revoke API key
exports.deleteApiKey = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const apiKey = await prisma.apiKey.findFirst({
    where: { id, userId: req.user.id },
  });

  if (!apiKey) {
    return next(new ApiError(`No API Key found with ID ${id} associated with your account`, 404));
  }

  await prisma.apiKey.delete({ where: { id } });
  res.status(204).send();
});
