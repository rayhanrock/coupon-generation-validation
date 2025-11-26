const mongoose = require("mongoose");

const userSpecificCouponSchema = new mongoose.Schema({
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
  is_redeemed: {
    type: Boolean,
    default: false,
  },
  redeemed_at: {
    type: Date,
    default: null,
  },
});

// Unique constraint: (coupon_id, user_id)
userSpecificCouponSchema.index({ coupon_id: 1, user_id: 1 }, { unique: true });

const UserSpecificCoupon = mongoose.model(
  "UserSpecificCoupon",
  userSpecificCouponSchema
);

module.exports = UserSpecificCoupon;
