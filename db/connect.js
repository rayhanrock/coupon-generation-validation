const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://rayhanbillahoffice_db_user:AgtsqccKvMLiNCBq@testmongo.cbjib1k.mongodb.net/?appName=testmongo"
    );
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
