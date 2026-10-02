const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");

exports.uploadFileMiddleware = uploadSingleImage("file");

exports.uploadImage = asyncHandler(async (req, res) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:8000";

  // If a file was uploaded
  if (req.file) {
    const filename = `upload-${uuidv4()}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`uploads/products/${filename}`);

    const fileUrl = `${baseUrl}/products/${filename}`;
    return res.status(201).json({
      status: "success",
      message: "Image uploaded successfully",
      data: {
        url: fileUrl,
        filename: filename,
      },
    });
  }

  // If a direct URL was sent in the body
  const directUrl = req.body.url || req.body.image;
  if (directUrl && typeof directUrl === "string") {
    return res.status(200).json({
      status: "success",
      message: "Image link validated successfully",
      data: {
        url: directUrl.trim(),
        filename: directUrl.split("/").pop() || "image.jpg",
      },
    });
  }

  return res.status(400).json({
    status: "fail",
    message: "Please provide a file to upload or an image link URL",
  });
});
