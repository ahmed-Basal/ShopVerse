const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "SubCategory required"],
      unique: [true, "SubCategory must be unique"],
      minlength: [2, "Too short subcategory name"],
      maxlength: [32, "Too long subcategory name"],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    description: {
      type: String,
    },
    image: String,
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: [true, "SubCategory must belong to a parent category"],
    },
  },
  { timestamps: true }
);

const setImageURL = (doc) => {
  if (doc.image && !doc.image.startsWith("http")) {
    const imageUrl = `${process.env.BASE_URL}/subcategories/${doc.image}`;
    doc.image = imageUrl;
  }
};

subCategorySchema.post("init", (doc) => {
  setImageURL(doc);
});

subCategorySchema.post("save", (doc) => {
  setImageURL(doc);
});

module.exports = mongoose.model("SubCategory", subCategorySchema);
