import express from "express";
const router = express.Router();

import { 
  register,
  login,
  getUser,
  logout,
  forgotPassword,
  resetPassword,
  getAllUsers,
} from "../controllers/authController.js";

import  authMiddleware  from "../middleware/authMiddleware.js"; 

// ---------------- AUTH ROUTES ----------------
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// ---------------- USER ROUTES ----------------
router.get("/user", authMiddleware, getUser);
router.get("/users", getAllUsers);


// ---------------- PASSWORD RESET ----------------
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
