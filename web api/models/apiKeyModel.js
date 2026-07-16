const mongoose = require("mongoose");

const apiKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "API key name is required"],
      trim: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "API key must belong to a user"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    permissions: [
      {
        route: {
          type: String,
          required: true,
        },
        methods: {
          type: [String],
          default: ["*"],
        },
      },
    ],
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const ApiKey = mongoose.model("ApiKey", apiKeySchema);

module.exports = ApiKey;
