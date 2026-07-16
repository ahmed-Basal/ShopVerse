const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const User = require("../models/userModel");

exports.addAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: { addresses: req.body },
    },
    { new: true },
  );

  res.status(200).json({
    status: "success",
    message: "Address added successfully.",
    data: user.addresses,
  });
});

exports.removeAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $pull: { addresses: { _id: req.params.addressId } },
    },
    { new: true },
  );

  res.status(200).json({
    status: "success",
    message: "Address removed successfully.",
    data: user.addresses,
  });
});

exports.getLoggedUserAddresses = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("addresses");

  res.status(200).json({
    status: "success",
    results: user.addresses.length,
    data: user.addresses,
  });
});

exports.updateAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findOneAndUpdate(
    { _id: req.user._id, "addresses._id": req.params.addressId },
    {
      $set: {
        "addresses.$.alias": req.body.alias,
        "addresses.$.details": req.body.details,
        "addresses.$.phone": req.body.phone,
        "addresses.$.city": req.body.city,
        "addresses.$.postalCode": req.body.postalCode,
      }
    },
    { new: true }
  );

  if (!user) {
    return next(new ApiError(`No address found with id ${req.params.addressId}`, 404));
  }

  res.status(200).json({
    status: "success",
    message: "Address updated successfully.",
    data: user.addresses,
  });
});
