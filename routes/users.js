var express = require("express");
var router = express.Router();
const User = require("../models/user");

/* GET users listing. */
router.get("/", async (req, res) => {
  // Hardcoded user data

  const hardcodedUser = {
    name: "John Doe",
    email: "john.doe@example.com",
    age: 30,
    createdAt: new Date(),
  };

  try {
    const user = await User.create(hardcodedUser);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
