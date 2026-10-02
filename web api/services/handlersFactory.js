const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const prisma = require("../config/prismaClient");

/**
 * Generic delete handler using Prisma
 * @param {string} modelName - Prisma model name (camelCase, e.g. 'product', 'category')
 */
exports.deleteOne = (modelName) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    try {
      await prisma[modelName].delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      if (err.code === "P2025") {
        return next(new ApiError(`No document for this id ${id}`, 404));
      }
      throw err;
    }
  });

/**
 * Generic update handler using Prisma
 */
exports.updateOne = (modelName) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    try {
      const document = await prisma[modelName].update({
        where: { id },
        data: req.body,
      });
      res.status(200).json({ data: document });
    } catch (err) {
      if (err.code === "P2025") {
        return next(new ApiError(`No document for this id ${id}`, 404));
      }
      throw err;
    }
  });

/**
 * Generic create handler using Prisma
 */
exports.createOne = (modelName) =>
  asyncHandler(async (req, res) => {
    const newDoc = await prisma[modelName].create({ data: req.body });
    res.status(201).json({ data: newDoc });
  });

/**
 * Generic getOne handler using Prisma
 * @param {string} modelName - Prisma model name
 * @param {object} include - Prisma include object for relations
 */
exports.getOne = (modelName, include) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const document = await prisma[modelName].findUnique({
      where: { id },
      ...(include && { include }),
    });

    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }
    res.status(200).json({ data: document });
  });

/**
 * Generic getAll handler using Prisma with pagination, search and filter
 * @param {string} modelName - Prisma model name
 * @param {object} opts - Options: { searchFields, defaultInclude, fixedWhere }
 */
exports.getAll = (modelName, opts = {}) =>
  asyncHandler(async (req, res) => {
    const { searchFields = [], defaultInclude, fixedWhere = {} } = opts;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Build where clause
    let where = { ...fixedWhere };

    // Apply filterObj from middleware
    if (req.filterObj) {
      where = { ...where, ...req.filterObj };
    }

    // Keyword search
    if (req.query.keyword && searchFields.length > 0) {
      where.OR = searchFields.map((field) => ({
        [field]: { contains: req.query.keyword, mode: "insensitive" },
      }));
    }

    // Sort
    let orderBy = { createdAt: "desc" };
    if (req.query.sort) {
      const sortMap = {
        price: { price: "asc" },
        "-price": { price: "desc" },
        rating: { ratingsAverage: "desc" },
        "-rating": { ratingsAverage: "desc" },
        newest: { createdAt: "desc" },
        "-createdAt": { createdAt: "desc" },
        oldest: { createdAt: "asc" },
        name: { name: "asc" },
      };
      orderBy = sortMap[req.query.sort] || { createdAt: "desc" };
    }

    const [total, documents] = await Promise.all([
      prisma[modelName].count({ where }),
      prisma[modelName].findMany({
        where,
        skip,
        take: limit,
        orderBy,
        ...(defaultInclude && { include: defaultInclude }),
      }),
    ]);

    const paginationResult = {
      currentPage: page,
      limit,
      numberOfPages: Math.ceil(total / limit),
      totalCount: total,
    };
    if (page * limit < total) paginationResult.next = page + 1;
    if (skip > 0) paginationResult.prev = page - 1;

    res.status(200).json({
      results: documents.length,
      paginationResult,
      data: documents,
    });
  });
