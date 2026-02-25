import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/User.js";
import  transporter  from "../config/mailer.js";


export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Optional: basic validation
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ message: "Phone number already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role === "admin" ? "admin" : "user",
    });

    const result = await user.save();

    res.status(201).json({
      message: "Account created successfully",
      userId: result._id,
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// ---------------- LOGIN ----------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔹 select password explicitly
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("jwt", token, {
  httpOnly: true,                // prevent JS access
  secure: process.env.NODE_ENV === "production", // true in prod
  sameSite: "strict",            // CSRF protection
  maxAge: 24 * 60 * 60 * 1000,   // 1 day
});

res.json({
  message: "Login successful",
  user: { _id: user._id, name: user.name, email: user.email, phone:user.phone },
});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ---------------- LOGOUT ----------------
export const logout = (req, res) => {
  res.clearCookie("jwt", { httpOnly: true });
  res.json({ message: "Logged out successfully" });
};

// ---------------- GET AUTHENTICATED USER ----------------
// export const getUser = async (req, res) => {
//   try {
//     const cookie = req.cookies.jwt;
//     if (!cookie) return res.status(401).json({ message: "Unauthenticated" });

//     const claims = jwt.verify(cookie, "secretKey");
//     const user = await User.findById(claims._id);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const { password, ...data } = user.toJSON();
//     res.json(data);
//   } catch (error) {
//     res.status(401).json({ message: "Unauthenticated" });
//   }
// };

export const getUser = async (req, res) => {
  try {
    // authMiddleware already verified token
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- GET ALL USERS ----------------
export const getAllUsers = async (req, res) => {
  try {
    console.log("🟢 GET /api/users called by:", req.user?._id);

    const users = await User.find().select("-password");
    console.log("🟢 USERS FOUND:", users.length);

    res.json({ count: users.length, users });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- FORGOT PASSWORD ----------------
// export const forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const resetToken = crypto.randomBytes(32).toString("hex");

//     user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
//     user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

//     await user.save();

//     const resetLink = `http://localhost:8080/reset-password/${resetToken}`;

//     await transporter.sendMail({
//       from: `"Osmium Blog" <${process.env.SMTP_USER}>`,
//       to: email,
//       subject: "Password Reset Request 🔐",
//       template: "reset-password",
//       context: { name: user.name, resetLink },
//     });

//     res.json({ message: "Password reset email sent" });
//   } catch (error) {
//     console.error("Forgot password error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// ---------------- FORGOT PASSWORD ----------------
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    // ❌ Custom scheme — works only after building standalone app
    // const resetLink = `platInvoice://reset-password/${resetToken}`;

    // ✅ Expo Go deep link (CHANGE IP to your Expo URL)
    const resetLink =
  `exp://192.168.1.195:8081/--/(auth)/reset-password/${resetToken}`;


    await transporter.sendMail({
      from: `"Osmium Blog" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Password Reset Request 🔐",
      template: "reset-password",
      context: { name: user.name, resetLink },
    });

    res.json({ message: "Password reset email sent" });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ---------------- RESET PASSWORD ----------------
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.approved = true;
    user.approvalDeadline = null;

    await user.save();

    res.json({ message: "User approved" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
