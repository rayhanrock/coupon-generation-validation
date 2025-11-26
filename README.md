Coupon Management System

A robust, scalable coupon management system built with Node.jsand Express. This application provides a complete solution for creating, validating, and redeeming coupons with support for both user-specific and time-bound promotional campaigns.

## 🎯 Technical Overview

### Key Technical Decisions

#### 1. **Table Design**

Instead of a single monolithic coupon table, we implemented a normalized structure:

- `coupons` - Core coupon information
- `user_specific_coupons` - User-targeted coupon details
- `time_specific_coupons` - Time-bound coupon configurations
- `coupon_redemptions` - Complete audit trail

This design provides flexibility for different coupon types while maintaining data integrity and enabling complex business rules.

#### 2. **Transactions**

All coupon creation and redemption operations use MongoDB sessions with transactions.

Ensures atomicity in multi-document operations, preventing partial states that could lead to business logic violations.

#### 3. **Decimal128 for Monetary Values**

Using MongoDB's Decimal128 type for all discount values instead of floating-point numbers.

Prevents floating-point arithmetic errors in financial calculations, ensuring precise monetary computations.

#### 4. **Code Generation Strategy**

Auto-generated 6-character alphanumeric codes with uniqueness validation.

Balances user-friendliness (short codes) with collision probability while maintaining database integrity.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │────│  Express API    │────│   MongoDB       │
│                 │    │                 │    │                 │
│ - Frontend      │    │ - Route Handlers│    │ - Coupons       │
│ - Mobile App    │    │ - Validation    │    │ - Users         │
│ - Admin Panel   │    │ - Business Logic│    │ - Redemptions   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Database Schema Design

#### Core Tables Relationship

```
coupons (1) ──── (1) user_specific_coupons
   │
   └─── (1) ──── (1) time_specific_coupons
   │
   └─── (1) ──── (∞) coupon_redemptions
```

## 🚀 Features

### Coupon Types

#### 1. **User-Specific Coupons**

- Targeted to individual users
- One-time redemption per coupon
- Perfect for personalized promotions
- Automatic user validation

#### 2. **Time-Specific Coupons**

- Campaign-based promotions
- Configurable validity periods
- Usage limits per user and total
- Real-time availability checking

### API Capabilities

- ✅ **Create** user-specific and time-bound coupons
- ✅ **Validate** coupon eligibility before checkout
- ✅ **Redeem** coupons with full transaction safety
- ✅ **Track** complete audit trail of all activities
- ✅ **Handle** race conditions and concurrent access
- ✅ **Prevent** double-spending and fraud

## 📋 API Endpoints

### 1. Create User-Specific Coupon

```http
POST /api/coupons/user-specific
Content-Type: application/json

{
  "user_id": "6926924c68d96e15e17d058e",
  "discount_value": 10.00,
  "discount_type": "PERCENTAGE",
  "created_by": "admin_user"
}
```

### 2. Create Time-Specific Coupon

```http
POST /api/coupons/time-specific
Content-Type: application/json

{
  "discount_value": 50.00,
  "discount_type": "FIXED_AMOUNT",
  "valid_from": "2025-12-01T00:00:00Z",
  "valid_until": "2025-12-31T23:59:59Z",
  "max_uses_per_user": 3,
  "total_usage_limit": 1000,
  "created_by": "admin_user"
}
```

### 3. Validate Coupon

```http
POST /api/coupons/validate
Content-Type: application/json

{
  "code": "ABC123",
  "user_id": "6926924c68d96e15e17d058e"
}
```

### 4. Redeem Coupon

```http
POST /api/coupons/redeem
Content-Type: application/json

{
  "code": "0LM5GE",
  "user_id": "6926924c68d96e15e17d058e",
  "order_id": "order_12345"
}
```

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Custom middleware with comprehensive error handling
- **Logging**: Morgan for HTTP request logging
- **Development**: Nodemon for hot reloading

## 📦 Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### 1. Clone the Repository

```bash
git clone https://github.com/rayhanrock/coupon-generation-validation.git
cd coupon-generation-validation
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Configuration

No need to configure , set up remote demo db

### Test Coupon Creation

```bash
# Create user-specific coupon
curl -X POST http://localhost:3000/api/coupons/user-specific \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID_FROM_PREVIOUS_STEP",
    "discount_value": 15.00,
    "discount_type": "PERCENTAGE",
    "created_by": "test_admin"
  }'

# Create time-specific coupon
curl -X POST http://localhost:3000/api/coupons/time-specific \
  -H "Content-Type: application/json" \
  -d '{
    "discount_value": 25.00,
    "discount_type": "FIXED_AMOUNT",
    "valid_from": "2025-01-01T00:00:00Z",
    "valid_until": "2025-12-31T23:59:59Z",
    "max_uses_per_user": 5,
    "total_usage_limit": 1000,
    "created_by": "test_admin"
  }'
```

### Test Coupon Validation

```bash
curl -X POST http://localhost:3000/api/coupons/validate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "GENERATED_CODE_FROM_CREATION",
    "user_id": "USER_ID"
  }'
```

### Test Coupon Redemption

```bash
curl -X POST http://localhost:3000/api/coupons/redeem \
  -H "Content-Type: application/json" \
  -d '{
    "code": "GENERATED_CODE_FROM_CREATION",
    "user_id": "USER_ID",
    "order_id": "test_order_123"
  }'
```

## 🔧 Configuration

### Database Indexes

The application automatically creates necessary indexes:

- `coupons.code` - Unique index for fast lookups
- `user_specific_coupons(coupon_id, user_id)` - Compound unique index
- Standard ObjectId indexes on foreign keys

### Logging

HTTP requests are logged using Morgan middleware. Logs are stored in `/logs/access.log`.

To customize logging:

```javascript
// In middlewares/logger.js
app.use(
  morgan("combined", {
    stream: fs.createWriteStream("./logs/access.log", { flags: "a" }),
  })
);
```

## 🚦 Error Handling

The API provides comprehensive error responses:

### Validation Errors (400)

```json
{
  "success": false,
  "error": "Missing required fields: user_id, discount_value"
}
```

### Not Found Errors (404)

```json
{
  "success": false,
  "error": "Coupon not found"
}
```

### Business Logic Errors (400)

```json
{
  "success": false,
  "error": "Cannot redeem coupon",
  "reason": "Coupon already redeemed"
}
```

### Server Errors (500)

```json
{
  "success": false,
  "error": "Internal server error"
}
```
