const mongoose = require("mongoose");
const validator = require("validator");
const menuSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name for this product"],
      trim: true,
      unique: true,
      lowercase: true,
      minLength: [3, "Name must be at least 3 characters"],
      maxLength: [100, "Name is too large"],
    },
    image: {
      type: String,
      validate: [validator.isURL, "Please provide a valid url"],
      required: true,
    },
    recipe: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
exports.Menu = mongoose.model("menus", menuSchema);