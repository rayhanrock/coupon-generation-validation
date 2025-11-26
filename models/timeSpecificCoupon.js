const mongoose = require("mongoose");

const timeSpecificCouponSchema = new mongoose.Schema({
  coupon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon",
    required: true,
  },
  valid_from: {
    type: Date,
    required: true,
  },
  valid_until: {
    type: Date,
    required: true,
  },
  max_uses_per_user: {
    type: Number,
    required: true,
  },
  total_usage_limit: {
    type: Number,
    default: null, // Unlimited if null
  },
  current_usage_count: {
    type: Number,
    default: 0,
  },
});

const TimeSpecificCoupon = mongoose.model(
  "TimeSpecificCoupon",
  timeSpecificCouponSchema
);

module.exports = TimeSpecificCoupon;
