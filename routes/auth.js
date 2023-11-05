const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fetchUser = require("../middleware/fetchUser");

// ROUTE 1 : create a user at api/auth/createUser
router.post(
  "/create-user",
  [
    body("name", "Enter a valid Name").isLength({ min: 3 }),
    body("email", "Enter a valid Email").isEmail(),
    body("password", "Password must be atleast 5 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array() });
    }

    //check whether email already exists
    let user = await User.findOne({ email: req.body.email });
    try {
      if (user) {
        return res.status(400).json({
          success: false,
          error: "Sorry User with this email already exists",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const securedPassword = await bcrypt.hash(req.body.password, salt);
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: securedPassword,
      });
      const data = {
        user: {
          id: user.id,
        },
      };
      const authToken = jwt.sign(data, process.env.JWT_SECRET_KEY);
      res.status(201).json({ success: true, authToken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ success: false, error: "Some Error occured" });
    }
  }
);

// ROUTE 2 : Authenticate a user at api/auth/login. No login required
router.post(
  "/login",
  [body("email", "Enter a valid Email").isEmail()],
  [body("password", "Password Cannot be blank").exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: errors.array() });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({
          success: false,
          error: "Please try to login with correct credentials",
        });
      }

      const passwordCompare = await bcrypt.compare(password, user.password);

      if (!passwordCompare) {
        return res.status(400).json({
          success: false,
          error: "Please try to login with correct credentials",
        });
      }
      const data = {
        user: {
          id: user.id,
        },
      };
      const authToken = jwt.sign(data, process.env.JWT_SECRET_KEY);
      res.status(200).json({ success: true, authToken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ success: false, error: "Internal server Error" });
    }
  }
);

// ROUTE 3 : get logged in user deatails at api/auth/getUser. login required
router.get("/get-user", fetchUser, async (req, res) => {
  try {
    const id = req.user.id;
    const user = await User.findById(id).select({ password: 0, _id: 0 });
    res.status(200).send({ success: true, user });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({ success: false, error: "Internal server Error" });
  }
});

module.exports = router;
