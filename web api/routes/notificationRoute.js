const express = require("express");
const authService = require("../services/authService");
const { notificationStream } = require("../services/notificationService");

const router = express.Router();

router.use(authService.protect);

router.get("/stream", notificationStream);

module.exports = router;
