const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    maxlength: 6,
    index: true,
  },
  coupon_type: {
    type: String,
    enum: ["USER_SPECIFIC", "TIME_SPECIFIC"],
    required: true,
  },
  discount_value: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
  discount_type: {
    type: String,
    enum: ["PERCENTAGE", "FIXED_AMOUNT"],
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  created_by: {
    type: String,
    required: true,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
});

// Auto-generate 6-character coupon code before saving
couponSchema.pre("save", function (next) {
  if (!this.code) {
    this.code = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
