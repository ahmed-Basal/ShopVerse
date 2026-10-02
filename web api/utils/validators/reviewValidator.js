const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const prisma = require("../../config/prismaClient");

exports.createReviewValidator = [
  check("title").optional(),
  check("ratings")
    .notEmpty()
    .withMessage("ratings value required")
    .isFloat({ min: 1, max: 5 })
    .withMessage("Ratings value must be between 1 to 5"),
  check("user").notEmpty().withMessage("Invalid Review user id format"),
  check("product")
    .notEmpty()
    .withMessage("Invalid Review product id format")
    .custom((val, { req }) =>
      prisma.review.findFirst({
        where: { userId: req.user.id, productId: req.body.product },
      }).then((review) => {
        if (review) {
          return Promise.reject(
            new Error("You already created a review before"),
          );
        }
      }),
    ),
  validatorMiddleware,
];

exports.getReviewValidator = [
  check("id").notEmpty().withMessage("Invalid Review id format"),
  validatorMiddleware,
];

exports.updateReviewValidator = [
  check("id")
    .notEmpty()
    .withMessage("Invalid Review id format")
    .custom((val, { req }) =>
      prisma.review.findUnique({ where: { id: val } }).then((review) => {
        if (!review) {
          return Promise.reject(new Error(`There is no review with id ${val}`));
        }

        if (review.userId !== req.user.id) {
          return Promise.reject(
            new Error(`Your are not allowed to perform this action`),
          );
        }
      }),
    ),
  validatorMiddleware,
];

exports.deleteReviewValidator = [
  check("id")
    .notEmpty()
    .withMessage("Invalid Review id format")
    .custom((val, { req }) => {
      if (req.user.role === "user") {
        return prisma.review.findUnique({ where: { id: val } }).then((review) => {
          if (!review) {
            return Promise.reject(
              new Error(`There is no review with id ${val}`),
            );
          }
          if (review.userId !== req.user.id) {
            return Promise.reject(
              new Error(`Your are not allowed to perform this action`),
            );
          }
        });
      }
      return true;
    }),
  validatorMiddleware,
];
