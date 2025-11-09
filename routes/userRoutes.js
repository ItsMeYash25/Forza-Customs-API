import express from "express";
import {
  login,
  profile,
  register,
  updateProfile,
  updateAvatar,
  deleteAvatar,
  viewAllUsers,
  addAddress,
  updateAddress,
  deleteAddress,
  logout,
} from "../controllers/userController.js";
import {
  viewSessions,
  logoutSession,
  logoutAllSessions,
} from "../controllers/sessionController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { singleUpload } from "../middleware/multer.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected routes
router.post("/logout", protect, logout);
router.get("/profile", protect, profile);
router.put("/profile", protect, singleUpload, updateProfile);

// Avatar management routes
router.put("/avatar", protect, singleUpload, updateAvatar);
router.delete("/avatar", protect, deleteAvatar);

// Address management routes
router.post("/address", protect, addAddress);
router.put("/address/:addressId", protect, updateAddress);
router.delete("/address/:addressId", protect, deleteAddress);

// Admin only routes
router.get("/", protect, adminOnly, viewAllUsers);
router.get("/sessions", protect, adminOnly, viewSessions);
router.delete("/sessions/:sessionId", protect, logoutSession);
router.delete("/sessions", protect, logoutAllSessions);

export default router;