const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

console.log("Auth routes loaded");

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const createToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

const getMissingSmtpKeys = () =>
  ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"].filter(
    (key) => !process.env[key],
  );

const sendResetCodeEmail = async (email, code) => {
  const missingSmtpKeys = getMissingSmtpKeys();
  const hasSmtpConfig = missingSmtpKeys.length === 0;

  console.log("Password reset email requested:", {
    email,
    smtpConfigured: hasSmtpConfig,
    missingSmtpKeys,
    host: process.env.SMTP_HOST || null,
    port: process.env.SMTP_PORT || null,
    userConfigured: Boolean(process.env.SMTP_USER),
    passConfigured: Boolean(process.env.SMTP_PASS),
  });

  if (!hasSmtpConfig) {
    console.log(`Digital Vault password reset code for ${email}: ${code}`);
    return {
      sent: false,
      message: `SMTP is not configured. Missing: ${missingSmtpKeys.join(", ")}. Code printed in backend terminal.`,
    };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.verify();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"Digital Vault" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your Digital Vault verification code",
    html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#111827;">
                <h2 style="margin:0 0 12px;">Digital Vault password reset</h2>
                <p style="line-height:1.6;color:#4b5563;">
                    We received a request to reset your Digital Vault password. Use the verification code below to continue.
                </p>
                <div style="font-size:32px;font-weight:800;letter-spacing:8px;background:#f3f4f6;border-radius:14px;padding:18px;text-align:center;margin:24px 0;">
                    ${code}
                </div>
                <p style="line-height:1.6;color:#4b5563;">
                    This code expires in 10 minutes. If you did not request this, you can safely ignore this email.
                </p>
                <p style="margin-top:28px;color:#6b7280;">Digital Vault Security</p>
            </div>
        `,
  });

  return {
    sent: true,
    message: "Verification code sent to your email.",
  };
};

router.get("/", (req, res) => {
  res.send("AUTH IS WORKING");
});

router.post("/register", async (req, res) => {
  try {
    const { firstName, secondName, phone, gender, password } = req.body;
    const email = normalizeEmail(req.body.email);
    const fullName =
      `${String(firstName || "").trim()} ${String(secondName || "").trim()}`.trim();

    if (!firstName || !secondName || !phone || !gender || !email || !password) {
      return res.status(400).json({
        message:
          "First name, second name, phone, gender, email and password are required",
      });
    }

    if (!["male", "female", "others"].includes(gender)) {
      return res.status(400).json({
        message: "Please choose a valid gender",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: fullName,
      firstName: firstName.trim(),
      secondName: secondName.trim(),
      email,
      phone: phone.trim(),
      gender,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        secondName: user.secondName,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
      },
    });
  } catch (error) {
    console.error("Registration failed:", error);
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = createToken(user);

    res.json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password -resetCode -resetCodeExpires -resetCodeVerified",
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      user,
    });
  } catch (error) {
    console.error("Profile load failed:", error);
    res.status(500).json({
      message: "Could not load profile",
      error: error.message,
    });
  }
});

router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { firstName, secondName, phone, gender } = req.body;

    if (!firstName || !secondName || !phone || !gender) {
      return res.status(400).json({
        message: "First name, second name, phone and gender are required",
      });
    }

    if (!["male", "female", "others"].includes(gender)) {
      return res.status(400).json({
        message: "Please choose a valid gender",
      });
    }

    const fullName =
      `${String(firstName).trim()} ${String(secondName).trim()}`.trim();

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        name: fullName,
        firstName: firstName.trim(),
        secondName: secondName.trim(),
        phone: phone.trim(),
        gender,
      },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password -resetCode -resetCodeExpires -resetCodeVerified");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Profile update failed:", error);
    res.status(500).json({
      message: "Could not update profile",
      error: error.message,
    });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    console.log("Forgot password requested:", { email });

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "No account found with this email",
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetCode = await bcrypt.hash(code, 10);
    user.resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.resetCodeVerified = false;
    await user.save();

    const mailResult = await sendResetCodeEmail(email, code);

    res.json({
      message: mailResult.message,
      emailSent: mailResult.sent,
      devCode: mailResult.sent ? undefined : code,
    });
  } catch (error) {
    console.error("Could not send verification code:", error);
    res.status(500).json({
      message: "Could not send verification code",
      error: error.message,
    });
  }
});

router.post("/verify-reset-code", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: "Email and verification code are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user || !user.resetCode || !user.resetCodeExpires) {
      return res.status(400).json({
        message: "Request a new verification code",
      });
    }

    if (user.resetCodeExpires < new Date()) {
      return res.status(400).json({
        message: "Verification code expired",
      });
    }

    const isCodeValid = await bcrypt.compare(code, user.resetCode);

    if (!isCodeValid) {
      return res.status(400).json({
        message: "Invalid verification code",
      });
    }

    user.resetCodeVerified = true;
    await user.save();

    res.json({
      message: "Verification successful",
    });
  } catch (error) {
    console.error("Verification failed:", error);
    res.status(500).json({
      message: "Verification failed",
      error: error.message,
    });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Email, password and confirm password are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const user = await User.findOne({ email });

    if (
      !user ||
      !user.resetCodeVerified ||
      user.resetCodeExpires < new Date()
    ) {
      return res.status(400).json({
        message: "Verify your code before resetting password",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    user.resetCodeVerified = false;
    await user.save();

    const token = createToken(user);

    res.json({
      message: "Password changed successfully",
      token,
    });
  } catch (error) {
    console.error("Password reset failed:", error);
    res.status(500).json({
      message: "Password reset failed",
      error: error.message,
    });
  }
});

module.exports = router;
