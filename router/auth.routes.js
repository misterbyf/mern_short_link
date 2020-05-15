const { Router } = require("express");
const { check, validationResult } = require("express-validator");
const config = require("config");
const jwtToken = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const router = Router();

router.post(
  "/register",
  [
    check("email", "Incorrect email.").isEmail(),
    check("password", "Password must have at least 6 symbols.").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        res.sendStatus(400).json({
          errors: errors.array(),
          message: "Incorrect registration data.",
        });
      }

      const { email, password } = req.body;

      const candidate = User.findOne({ email });

      if (candidate) {
        return res
          .sendStatus(400)
          .json({ message: "Oops. A user already exist!" });
      }

      const hashedPassword = await bcrypt.hash(password);
      const user = new User({ email, password: hashedPassword });

      user.save();

      res.statusCode(201).json("User has been created.");
    } catch (e) {
      res
        .statusCode(500)
        .json({ message: "Whops looks something wrong, try again." });
    }
  }
);

router.post(
  "/login",
  [
    check("email", "Enter correct email.").normalizeEmail().isEmail(),
    check("password", "Enter password.").exists(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        res.sendStatus(400).json({
          errors: errors.array(),
          message: "Incorrenct login data",
        });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        res.sendStatus(400).json({
          message: "User not found",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        res.sendStatus(400).json({
          message: "Incorect password",
        });
      }

      const token = jwtToken.sign(
        { userId: user.id },
        config.get("jsonWebToken"),
        { expiresIn: "1h" }
      );

      res.json({
        token,
        userId: user.id,
      });
    } catch (e) {
      res
        .statusCode(500)
        .json({ message: "Whops looks something wrong, try again." });
    }
  }
);

module.exports = router;
