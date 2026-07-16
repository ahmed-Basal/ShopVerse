const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

exports.createApiKeyValidator = [
  check("name")
    .notEmpty()
    .withMessage("API Key name is required")
    .isLength({ min: 3 })
    .withMessage("Too short API key name (min 3 chars)")
    .isLength({ max: 50 })
    .withMessage("Too long API key name (max 50 chars)"),
  check("expiresAt")
    .optional()
    .isISO8601()
    .withMessage("Invalid expiration date format (must be ISO8601 string)"),
  check("permissions")
    .optional()
    .isArray()
    .withMessage("Permissions must be an array of objects"),
  check("permissions.*.route")
    .notEmpty()
    .withMessage("Route is required for each permission item")
    .isString()
    .withMessage("Route must be a string"),
  check("permissions.*.methods")
    .optional()
    .isArray()
    .withMessage("Methods must be an array of strings"),
  check("permissions.*.methods.*")
    .isString()
    .withMessage("Each method must be a string")
    .toUpperCase()
    .custom((value) => {
      const allowedMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "*"];
      if (!allowedMethods.includes(value)) {
        throw new Error(`Invalid HTTP method: ${value}. Allowed: ${allowedMethods.join(", ")}`);
      }
      return true;
    }),
  validatorMiddleware,
];

exports.deleteApiKeyValidator = [
  check("id").isMongoId().withMessage("Invalid API key id format"),
  validatorMiddleware,
];
