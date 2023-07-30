import express from "express";
import {
  login,
  profile,
  register,
  viewAllUsers,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

router.get("/", viewAllUsers);
router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, profile);

export default router;
