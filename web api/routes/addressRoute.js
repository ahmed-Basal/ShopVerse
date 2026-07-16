const express = require("express");

const authService = require("../services/authService");

const {
  addAddress,
  removeAddress,
  getLoggedUserAddresses,
  updateAddress,
} = require("../services/addressService");

const router = express.Router();

router.use(authService.protectOrApiKey, authService.allowedTo("user"));

router.route("/").post(addAddress).get(getLoggedUserAddresses);

router.route("/:addressId").put(updateAddress).delete(removeAddress);

module.exports = router;
