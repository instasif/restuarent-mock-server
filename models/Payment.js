const mongoose = require("mongoose");
const validator = require("validator");
const { ObjectId } = mongoose.Schema.Types;

const paymentsSchema = mongoose.Schema(
  {
    menuIds: {
      type: [ObjectId],
      required: true,
      validate: {
        validator: (value) => value.length > 0,
        message: "At least one menuId is required",
      },
    },
    cartIds: {
      type: [ObjectId],
      required: true,
      validate: {
        validator: (value) => value.length > 0,
        message: "At least one cartId is required",
      },
    },
    transactionId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    price: {
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
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
exports.Payment = mongoose.model("payments", paymentsSchema);
