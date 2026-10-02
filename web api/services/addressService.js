const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const prisma = require("../config/prismaClient");

exports.addAddress = asyncHandler(async (req, res, next) => {
  await prisma.address.create({
    data: {
      userId: req.user.id,
      alias: req.body.alias,
      details: req.body.details,
      phone: req.body.phone,
      city: req.body.city,
      postalCode: req.body.postalCode,
    },
  });

  const addresses = await prisma.address.findMany({ where: { userId: req.user.id } });

  res.status(200).json({
    status: "success",
    message: "Address added successfully.",
    data: addresses,
  });
});

exports.removeAddress = asyncHandler(async (req, res, next) => {
  const found = await prisma.address.findFirst({
    where: { id: req.params.addressId, userId: req.user.id },
  });

  if (!found) {
    return next(new ApiError(`No address found with id ${req.params.addressId}`, 404));
  }

  await prisma.address.delete({ where: { id: req.params.addressId } });

  const addresses = await prisma.address.findMany({ where: { userId: req.user.id } });

  res.status(200).json({
    status: "success",
    message: "Address removed successfully.",
    data: addresses,
  });
});

exports.getLoggedUserAddresses = asyncHandler(async (req, res, next) => {
  const addresses = await prisma.address.findMany({ where: { userId: req.user.id } });

  res.status(200).json({
    status: "success",
    results: addresses.length,
    data: addresses,
  });
});

exports.updateAddress = asyncHandler(async (req, res, next) => {
  const found = await prisma.address.findFirst({
    where: { id: req.params.addressId, userId: req.user.id },
  });

  if (!found) {
    return next(new ApiError(`No address found with id ${req.params.addressId}`, 404));
  }

  await prisma.address.update({
    where: { id: req.params.addressId },
    data: {
      alias: req.body.alias,
      details: req.body.details,
      phone: req.body.phone,
      city: req.body.city,
      postalCode: req.body.postalCode,
    },
  });

  const addresses = await prisma.address.findMany({ where: { userId: req.user.id } });

  res.status(200).json({
    status: "success",
    message: "Address updated successfully.",
    data: addresses,
  });
});
