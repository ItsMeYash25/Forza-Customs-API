import express from "express";
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesWithCount,
} from "../controllers/categoryController.js";
import { protect, adminOnly, hasAnyRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllCategories);
router.get("/with-count", getCategoriesWithCount);
router.get("/:id", getCategoryById);

// Protected routes - Admin and Warehouse Admin
router.post(
    "/",
    protect,
    hasAnyRole("admin", "warehouse_admin"),
    createCategory
);

router.put(
    "/:id",
    protect,
    hasAnyRole("admin", "warehouse_admin"),
    updateCategory
);

// Admin only routes
router.delete("/:id", protect, adminOnly, deleteCategory);

export default router;