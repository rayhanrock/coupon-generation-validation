var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("./middlewares/logger");

const connectDB = require("./db/connect");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var couponsRouter = require("./routes/coupons");

var app = express();

// Connect to DB
connectDB();

app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api/coupons", couponsRouter);

module.exports = app;
