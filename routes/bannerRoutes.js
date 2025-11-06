import express from "express";
import {
    getBanners,
    getActiveBanners,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBannerActive,
    bulkDeleteBanners,
    bulkToggleActive,
} from "../controllers/bannerController.js";
import { protect, adminOnly, warehouseAdminOnly } from "../middleware/authMiddleware.js";
import { singleUpload } from "../middleware/multer.js";

const router = express.Router();

// Public routes
router.get("/", getBanners);
router.get("/active", getActiveBanners);
router.get("/:id", getBannerById);

// Protected routes - Admin or Warehouse Admin
router.post("/", protect, warehouseAdminOnly, singleUpload, createBanner);
router.put("/:id", protect, warehouseAdminOnly, singleUpload, updateBanner);
router.delete("/:id", protect, adminOnly, deleteBanner);

// Toggle active status
router.patch("/:id/toggle-active", protect, warehouseAdminOnly, toggleBannerActive);

// Bulk operations
router.post("/bulk-delete", protect, adminOnly, bulkDeleteBanners);
router.patch("/bulk-toggle", protect, warehouseAdminOnly, bulkToggleActive);

export default router;