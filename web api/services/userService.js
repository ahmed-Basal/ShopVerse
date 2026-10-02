const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");

const ApiError = require("../utils/apiError");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const createToken = require("../utils/createToken");
const prisma = require("../config/prismaClient");
const sharp = require("sharp");

exports.uploadUserImage = uploadSingleImage("profileImg");

exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `user-${uuidv4()}-${Date.now()}.jpeg`;
  if (req.file) {
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/users/${filename}`);
    req.body.profileImg = filename;
  }
  next();
});

const buildImageUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith("http") || filename.startsWith("data:")) return filename;
  return `${process.env.BASE_URL || "http://localhost:8000"}/users/${filename}`;
};

const sanitize = (user) => {
  if (!user) return null;
  const { password, ...rest } = user;
  return { ...rest, profileImg: buildImageUrl(rest.profileImg) };
};

exports.getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  const [total, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
  ]);
  const paginationResult = { currentPage: page, limit, numberOfPages: Math.ceil(total / limit) };
  res.status(200).json({ results: users.length, paginationResult, data: users.map(sanitize) });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return next(new ApiError(`No user for id ${req.params.id}`, 404));
  res.status(200).json({ data: sanitize(user) });
});

exports.createUser = asyncHandler(async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 12);
  const user = await prisma.user.create({
    data: {
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      phone: req.body.phone || null,
      role: req.body.role || "user",
    },
  });
  res.status(201).json({ data: sanitize(user) });
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        slug: req.body.slug,
        phone: req.body.phone,
        email: req.body.email,
        profileImg: req.body.profileImg,
        role: req.body.role,
      },
    });
    res.status(200).json({ data: sanitize(user) });
  } catch (err) {
    if (err.code === "P2025") return next(new ApiError(`No user for id ${req.params.id}`, 404));
    throw err;
  }
});

exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        password: await bcrypt.hash(req.body.password, 12),
        passwordChangedAt: new Date(),
      },
    });
    res.status(200).json({ data: sanitize(user) });
  } catch (err) {
    if (err.code === "P2025") return next(new ApiError(`No user for id ${req.params.id}`, 404));
    throw err;
  }
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return next(new ApiError(`No user for id ${req.params.id}`, 404));
    throw err;
  }
});

exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
  req.params.id = req.user.id;
  next();
});

exports.updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: new Date(),
    },
  });
  const token = createToken(user.id);
  res.status(200).json({ data: sanitize(user), token });
});

exports.updateLoggedUserData = asyncHandler(async (req, res, next) => {
  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
    },
  });
  res.status(200).json({ data: sanitize(updatedUser) });
});

exports.deleteLoggedUserData = asyncHandler(async (req, res, next) => {
  await prisma.user.update({ where: { id: req.user.id }, data: { active: false } });
  res.status(204).json({ status: "Success" });
});
