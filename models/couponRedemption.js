const mongoose = require("mongoose");

const couponRedemptionSchema = new mongoose.Schema({
  coupon_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon",
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  redeemed_at: {
    type: Date,
    default: Date.now,
  },
  order_id: {
    type: String,
    default: null, // Optional: link to order
  },
  discount_applied: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
});

const CouponRedemption = mongoose.model(
  "CouponRedemption",
  couponRedemptionSchema
);

module.exports = CouponRedemption;
