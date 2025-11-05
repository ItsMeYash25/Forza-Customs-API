import express from "express";
import {
  addParts,
  viewAllParts,
  viewPartsById,
  updateParts,
  deleteParts,
  addGalleryImages,
  deleteGalleryImage,
  updateStock,
  getFeaturedParts,
} from "../controllers/partsController.js";
import { singleUpload, multipleUpload } from "../middleware/multer.js";
import { protect, hasAnyRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", viewAllParts);
router.get("/featured", getFeaturedParts);
router.get("/:id", viewPartsById);

// Protected routes - Admin and Warehouse Admin only
router.post(
  "/add",
  protect,
  hasAnyRole("admin", "warehouse_admin"),
  singleUpload,
  addParts
);

router.put(
  "/update/:id",
  protect,
  hasAnyRole("admin", "warehouse_admin"),
  singleUpload,
  updateParts
);

router.delete(
  "/delete/:id",
  protect,
  hasAnyRole("admin", "warehouse_admin"),
  deleteParts
);

// Gallery management routes
router.post(
  "/:id/gallery",
  protect,
  hasAnyRole("admin", "warehouse_admin"),
  multipleUpload,
  addGalleryImages
);

router.delete(
  "/:id/gallery/:imageId",
  protect,
  hasAnyRole("admin", "warehouse_admin"),
  deleteGalleryImage
);

// Stock management
router.patch(
  "/:id/stock",
  protect,
  hasAnyRole("admin", "warehouse_admin"),
  updateStock
);

export default router;