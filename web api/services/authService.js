const crypto = require("crypto");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const sendEmail = require("../utils/sendEmail");
const createToken = require("../utils/createToken");

const User = require("../models/userModel");
const ApiKey = require("../models/apiKeyModel");


exports.signup = asyncHandler(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });

  const token = createToken(user._id);

  res.status(201).json({ data: user, token });
});

exports.login = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ApiError("Incorrect email or password", 401));
  }

  const token = createToken(user._id);

  delete user._doc.password;

  res.status(200).json({ data: user, token });
});

exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.query.token) {
    token = req.query.token;
  }
  if (!token) {
    return next(
      new ApiError(
        "You are not login, Please login to get access this route",
        401,
      ),
    );
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  const currentUser = await User.findById(decoded.userId);
  if (!currentUser) {
    return next(
      new ApiError(
        "The user that belong to this token does no longer exist",
        401,
      ),
    );
  }

  if (currentUser.passwordChangedAt) {
    const passChangedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10,
    );

    if (passChangedTimestamp > decoded.iat) {
      return next(
        new ApiError(
          "User recently changed his password. please login again..",
          401,
        ),
      );
    }
  }

  req.user = currentUser;
  next();
});

exports.protectApiKey = asyncHandler(async (req, res, next) => {
  let key = req.headers["x-api-key"] || req.query.apiKey;

  if (!key && req.headers.authorization && req.headers.authorization.startsWith("Key")) {
    key = req.headers.authorization.split(" ")[1];
  }

  if (!key) {
    return next(new ApiError("API Key is required to access this route", 401));
  }

  const apiKeyDoc = await ApiKey.findOne({ key, isActive: true }).populate("user");

  if (!apiKeyDoc) {
    return next(new ApiError("Invalid or inactive API Key", 401));
  }

  if (apiKeyDoc.expiresAt && apiKeyDoc.expiresAt < Date.now()) {
    return next(new ApiError("API Key has expired", 401));
  }

  const currentUser = apiKeyDoc.user;
  if (!currentUser || !currentUser.active) {
    return next(
      new ApiError(
        "The user associated with this API key is inactive or no longer exists",
        401
      )
    );
  }

  // Verify route and method permissions (scopes)
  if (apiKeyDoc.permissions && apiKeyDoc.permissions.length > 0) {
    const routeTemplate = req.route
      ? `${req.baseUrl}${req.route.path === "/" ? "" : req.route.path}`
      : req.originalUrl.split("?")[0];
    const currentMethod = req.method.toUpperCase();

    const isAllowed = apiKeyDoc.permissions.some((permission) => {
      const permRoute = permission.route.trim();
      const routeMatch = permRoute === "*" || permRoute === routeTemplate;

      const methodMatch =
        permission.methods.includes("*") ||
        permission.methods.some((m) => m.toUpperCase() === currentMethod);

      return routeMatch && methodMatch;
    });

    if (!isAllowed) {
      return next(
        new ApiError(
          `API Key does not have permission to access ${currentMethod} ${routeTemplate}`,
          403
        )
      );
    }
  }

  req.user = currentUser;
  next();
});

exports.protectOrApiKey = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (token) {
    return exports.protect(req, res, next);
  }

  return exports.protectApiKey(req, res, next);
});

exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError("You are not allowed to access this route", 403),
      );
    }
    next();
  });

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    // Timing mitigation: delay response to match the time taken by DB save & SMTP email sending
    const delay = Math.floor(Math.random() * 400) + 400; // 400ms to 800ms
    await new Promise((resolve) => setTimeout(resolve, delay));
    return res
      .status(200)
      .json({ status: "Success", message: "Reset code sent to email" });
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  user.passwordResetCode = hashedResetCode;

  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  user.passwordResetVerified = false;

  await user.save();

  const message = `Hi ${user.name},\n We received a request to reset the password on your E-shop Account. \n ${resetCode} \n Enter this code to complete the reset. \n Thanks for helping us keep your account secure.\n The E-shop Team`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset code (valid for 10 min)",
      message,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;

    await user.save();
    return next(new ApiError("There is an error in sending email", 500));
  }

  res
    .status(200)
    .json({ status: "Success", message: "Reset code sent to email" });
});

exports.verifyPassResetCode = asyncHandler(async (req, res, next) => {
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ApiError("Reset code invalid or expired"));
  }

  user.passwordResetVerified = true;
  await user.save();

  res.status(200).json({
    status: "Success",
  });
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiError(`There is no user with email ${req.body.email}`, 404),
    );
  }

  if (!user.passwordResetVerified) {
    return next(new ApiError("Reset code not verified", 400));
  }

  user.password = req.body.newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;

  await user.save();

  const token = createToken(user._id);
  res.status(200).json({ token });
});
