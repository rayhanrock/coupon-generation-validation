const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Import models
const Coupon = require("../models/coupon");
const UserSpecificCoupon = require("../models/userSpecificCoupon");
const TimeSpecificCoupon = require("../models/timeSpecificCoupon");
const CouponRedemption = require("../models/couponRedemption");
const User = require("../models/user");

// Helper function to generate unique coupon code
const generateCouponCode = async () => {
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const existingCoupon = await Coupon.findOne({ code });
    if (!existingCoupon) {
      isUnique = true;
    }
  }

  return code;
};

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// POST /api/coupons/user-specific
// Create a user-specific coupon (one-time use per user)
router.post("/user-specific", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { user_id, discount_value, discount_type, created_by } = req.body;

    // Validate required fields
    if (!user_id || !discount_value || !discount_type || !created_by) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: user_id, discount_value, discount_type, created_by",
      });
    }

    // Validate user_id format
    if (!isValidObjectId(user_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user_id format",
      });
    }

    // Validate discount_type
    if (!["PERCENTAGE", "FIXED_AMOUNT"].includes(discount_type)) {
      return res.status(400).json({
        success: false,
        error: "discount_type must be either PERCENTAGE or FIXED_AMOUNT",
      });
    }

    // Validate discount_value
    if (typeof discount_value !== "number" || discount_value <= 0) {
      return res.status(400).json({
        success: false,
        error: "discount_value must be a positive number",
      });
    }

    // Check if user exists
    const userExists = await User.findById(user_id).session(session);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Generate unique coupon code
    const code = await generateCouponCode();

    // Create main coupon
    const coupon = new Coupon({
      code,
      coupon_type: "USER_SPECIFIC",
      discount_value: mongoose.Types.Decimal128.fromString(
        discount_value.toString()
      ),
      discount_type,
      created_by,
      is_active: true,
    });

    await coupon.save({ session });

    // Create user-specific coupon entry
    const userSpecificCoupon = new UserSpecificCoupon({
      coupon_id: coupon._id,
      user_id: user_id,
      is_redeemed: false,
      redeemed_at: null,
    });

    await userSpecificCoupon.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: {
        coupon_id: coupon._id,
        code: coupon.code,
        user_id: user_id,
        discount_value: parseFloat(coupon.discount_value.toString()),
        discount_type: coupon.discount_type,
        created_at: coupon.created_at,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating user-specific coupon:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  } finally {
    session.endSession();
  }
});

// POST /api/coupons/time-specific
// Create a time-bound coupon (multi-use within time period)
router.post("/time-specific", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      discount_value,
      discount_type,
      valid_from,
      valid_until,
      max_uses_per_user,
      total_usage_limit,
      created_by,
    } = req.body;

    // Validate required fields
    if (
      !discount_value ||
      !discount_type ||
      !valid_from ||
      !valid_until ||
      !max_uses_per_user ||
      !created_by
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: discount_value, discount_type, valid_from, valid_until, max_uses_per_user, created_by",
      });
    }

    // Validate discount_type
    if (!["PERCENTAGE", "FIXED_AMOUNT"].includes(discount_type)) {
      return res.status(400).json({
        success: false,
        error: "discount_type must be either PERCENTAGE or FIXED_AMOUNT",
      });
    }

    // Validate discount_value
    if (typeof discount_value !== "number" || discount_value <= 0) {
      return res.status(400).json({
        success: false,
        error: "discount_value must be a positive number",
      });
    }

    // Validate dates
    const validFromDate = new Date(valid_from);
    const validUntilDate = new Date(valid_until);

    if (isNaN(validFromDate.getTime()) || isNaN(validUntilDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: "Invalid date format for valid_from or valid_until",
      });
    }

    if (validFromDate >= validUntilDate) {
      return res.status(400).json({
        success: false,
        error: "valid_from must be before valid_until",
      });
    }

    // Validate max_uses_per_user
    if (!Number.isInteger(max_uses_per_user) || max_uses_per_user <= 0) {
      return res.status(400).json({
        success: false,
        error: "max_uses_per_user must be a positive integer",
      });
    }

    // Validate total_usage_limit if provided
    if (total_usage_limit !== null && total_usage_limit !== undefined) {
      if (!Number.isInteger(total_usage_limit) || total_usage_limit <= 0) {
        return res.status(400).json({
          success: false,
          error: "total_usage_limit must be a positive integer or null",
        });
      }
    }

    // Generate unique coupon code
    const code = await generateCouponCode();

    // Create main coupon
    const coupon = new Coupon({
      code,
      coupon_type: "TIME_SPECIFIC",
      discount_value: mongoose.Types.Decimal128.fromString(
        discount_value.toString()
      ),
      discount_type,
      created_by,
      is_active: true,
    });

    await coupon.save({ session });

    // Create time-specific coupon entry
    const timeSpecificCoupon = new TimeSpecificCoupon({
      coupon_id: coupon._id,
      valid_from: validFromDate,
      valid_until: validUntilDate,
      max_uses_per_user,
      total_usage_limit: total_usage_limit || null,
      current_usage_count: 0,
    });

    await timeSpecificCoupon.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: {
        coupon_id: coupon._id,
        code: coupon.code,
        discount_value: parseFloat(coupon.discount_value.toString()),
        discount_type: coupon.discount_type,
        valid_from: timeSpecificCoupon.valid_from,
        valid_until: timeSpecificCoupon.valid_until,
        max_uses_per_user: timeSpecificCoupon.max_uses_per_user,
        total_usage_limit: timeSpecificCoupon.total_usage_limit,
        created_at: coupon.created_at,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating time-specific coupon:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  } finally {
    session.endSession();
  }
});

// POST /api/coupons/validate
// Validate if a coupon can be used by a user
router.post("/validate", async (req, res) => {
  try {
    const { code, user_id } = req.body;

    // Validate required fields
    if (!code || !user_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: code, user_id",
      });
    }

    // Validate user_id format
    if (!isValidObjectId(user_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user_id format",
      });
    }

    // Find coupon by code
    const coupon = await Coupon.findOne({ code, is_active: true });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: "Coupon not found",
      });
    }

    let canRedeem = true;
    let message = "Coupon is valid and ready to use";

    if (coupon.coupon_type === "USER_SPECIFIC") {
      // Check user-specific coupon
      const userSpecificCoupon = await UserSpecificCoupon.findOne({
        coupon_id: coupon._id,
        user_id: user_id,
      });

      if (!userSpecificCoupon) {
        canRedeem = false;
        message = "Coupon not available for this user";
      } else if (userSpecificCoupon.is_redeemed) {
        canRedeem = false;
        message = "Coupon already redeemed";
      }
    } else if (coupon.coupon_type === "TIME_SPECIFIC") {
      // Check time-specific coupon
      const timeSpecificCoupon = await TimeSpecificCoupon.findOne({
        coupon_id: coupon._id,
      });

      if (!timeSpecificCoupon) {
        canRedeem = false;
        message = "Coupon configuration not found";
      } else {
        const now = new Date();

        // Check if coupon is within valid time period
        if (
          now < timeSpecificCoupon.valid_from ||
          now > timeSpecificCoupon.valid_until
        ) {
          canRedeem = false;
          message = "Coupon expired";
        }

        // Check total usage limit
        if (
          timeSpecificCoupon.total_usage_limit &&
          timeSpecificCoupon.current_usage_count >=
            timeSpecificCoupon.total_usage_limit
        ) {
          canRedeem = false;
          message = "Usage limit exceeded";
        }

        // Check user-specific usage limit
        if (canRedeem) {
          const userRedemptionCount = await CouponRedemption.countDocuments({
            coupon_id: coupon._id,
            user_id: user_id,
          });

          if (userRedemptionCount >= timeSpecificCoupon.max_uses_per_user) {
            canRedeem = false;
            message = "Usage limit exceeded";
          }
        }
      }
    }

    const responseData = {
      coupon_id: coupon._id,
      code: coupon.code,
      coupon_type: coupon.coupon_type,
      discount_value: parseFloat(coupon.discount_value.toString()),
      discount_type: coupon.discount_type,
      can_redeem: canRedeem,
      message: message,
    };

    res.status(200).json({
      success: true,
      valid: canRedeem,
      data: responseData,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// POST /api/coupons/redeem
// Redeem a coupon for a user
router.post("/redeem", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { code, user_id, order_id } = req.body;

    // Validate required fields
    if (!code || !user_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: code, user_id",
      });
    }

    // Validate user_id format
    if (!isValidObjectId(user_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid user_id format",
      });
    }

    // Find coupon by code
    const coupon = await Coupon.findOne({ code, is_active: true }).session(
      session
    );

    if (!coupon) {
      return res.status(400).json({
        success: false,
        error: "Cannot redeem coupon",
        reason: "Coupon not found or inactive",
      });
    }

    let canRedeem = true;
    let reason = "";

    if (coupon.coupon_type === "USER_SPECIFIC") {
      // Handle user-specific coupon redemption
      const userSpecificCoupon = await UserSpecificCoupon.findOne({
        coupon_id: coupon._id,
        user_id: user_id,
      }).session(session);

      if (!userSpecificCoupon) {
        canRedeem = false;
        reason = "Invalid user";
      } else if (userSpecificCoupon.is_redeemed) {
        canRedeem = false;
        reason = "Coupon already redeemed";
      }

      if (canRedeem) {
        // Mark as redeemed
        await UserSpecificCoupon.updateOne(
          { _id: userSpecificCoupon._id },
          {
            is_redeemed: true,
            redeemed_at: new Date(),
          },
          { session }
        );
      }
    } else if (coupon.coupon_type === "TIME_SPECIFIC") {
      // Handle time-specific coupon redemption
      const timeSpecificCoupon = await TimeSpecificCoupon.findOne({
        coupon_id: coupon._id,
      }).session(session);

      if (!timeSpecificCoupon) {
        canRedeem = false;
        reason = "Coupon configuration not found";
      } else {
        const now = new Date();

        // Check if coupon is within valid time period
        if (
          now < timeSpecificCoupon.valid_from ||
          now > timeSpecificCoupon.valid_until
        ) {
          canRedeem = false;
          reason = "Coupon expired";
        }

        // Check total usage limit
        if (
          timeSpecificCoupon.total_usage_limit &&
          timeSpecificCoupon.current_usage_count >=
            timeSpecificCoupon.total_usage_limit
        ) {
          canRedeem = false;
          reason = "Usage limit exceeded";
        }

        // Check user-specific usage limit
        if (canRedeem) {
          const userRedemptionCount = await CouponRedemption.countDocuments({
            coupon_id: coupon._id,
            user_id: user_id,
          }).session(session);

          if (userRedemptionCount >= timeSpecificCoupon.max_uses_per_user) {
            canRedeem = false;
            reason = "Usage limit exceeded";
          }
        }

        if (canRedeem) {
          // Increment usage count
          await TimeSpecificCoupon.updateOne(
            { _id: timeSpecificCoupon._id },
            { $inc: { current_usage_count: 1 } },
            { session }
          );
        }
      }
    }

    if (!canRedeem) {
      return res.status(400).json({
        success: false,
        error: "Cannot redeem coupon",
        reason: reason,
      });
    }

    // Create redemption record
    const redemption = new CouponRedemption({
      coupon_id: coupon._id,
      user_id: user_id,
      redeemed_at: new Date(),
      order_id: order_id || null,
      discount_applied: coupon.discount_value,
    });

    await redemption.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      data: {
        redemption_id: redemption._id,
        coupon_id: coupon._id,
        code: coupon.code,
        user_id: user_id,
        discount_applied: parseFloat(coupon.discount_value.toString()),
        redeemed_at: redemption.redeemed_at,
        message: "Coupon redeemed successfully",
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error redeeming coupon:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  } finally {
    session.endSession();
  }
});

module.exports = router;
