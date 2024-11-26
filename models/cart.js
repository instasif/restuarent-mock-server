const mongoose = require("mongoose");
const validator = require("validator");
const { ObjectId } = mongoose.Schema.Types;

const cartSchema = mongoose.Schema(
  {
    menuId: {
      type: ObjectId,
      required: true,
      ref: "menu",
    },
    name: {
      type: String,
      required: [true, "Please provide a name for this product"],
      trim: true,
      lowercase: true,
      minLength: [3, "Name must be at least 3 characters"],
      maxLength: [100, "Name is too large"],
    },
    image: {
      type: String,
      validate: [validator.isURL, "Please provide a valid url"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      validate: [validator.isEmail, "Please provide a valid email"],
      trim: true,
      lowercase: true,
      required: [true, "Email address is required"],
    },
  },
  {
    timestamps: true,
  }
);
exports.Cart = mongoose.model("carts", cartSchema);
