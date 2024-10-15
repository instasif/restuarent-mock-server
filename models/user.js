const mongoose = require("mongoose");
const validator = require("validator");
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name for this product"],
      lowercase: true,
      maxLength: [100, "Name is too large"],
    },
    photo: {
      type: String,
      validate: [validator.isURL, "Please provide a valid url"],
      required: true,
    },
    role: {
      type: String,
      default: "customer",
      required: true,
    },
    email: {
      type: String,
      validate: [validator.isEmail, "Please provide a valid email"],
      trim: true,
      lowercase: true,
      unique: true,
      required: [true, "Email address is required"],
    },
  },
  {
    timestamps: true,
  }
);
exports.User = mongoose.model("users", userSchema);
