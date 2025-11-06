import express from "express";
import {
    getDeals,
    getActiveDeals,
    getDealById,
    createDeal,
    updateDeal,
    deleteDeal,
    addProductsToDeal,
    removeProductsFromDeal,
    toggleDealActive,
} from "../controllers/dealController.js";
import { protect, adminOnly, warehouseAdminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getDeals);
router.get("/active", getActiveDeals);
router.get("/:id", getDealById);

// Protected routes - Admin or Warehouse Admin
router.post("/", protect, warehouseAdminOnly, createDeal);
router.put("/:id", protect, warehouseAdminOnly, updateDeal);
router.delete("/:id", protect, adminOnly, deleteDeal);

// Product management in deals
router.post("/:id/products", protect, warehouseAdminOnly, addProductsToDeal);
router.delete("/:id/products", protect, warehouseAdminOnly, removeProductsFromDeal);

// Toggle active status
router.patch("/:id/toggle-active", protect, warehouseAdminOnly, toggleDealActive);

export default router;