import express from "express";
import {
  createBill,
  getAllBills,
  getMyBills,
  getBillById,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  getOrderStats,
} from "../controllers/billsController.js";
import {
  protect,
  adminOnly,
  warehouseAdminOnly,
  hasAnyRole,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected routes - All authenticated users

// Create order from cart
// POST /api/bills
// Body: { contact: { name, email, phone, address }, paymentMethod: "cod" | "online" }
router.post("/", protect, createBill);

// Get user's own orders
// GET /api/bills/my-orders?status=pending&page=1&limit=10
router.get("/my-orders", protect, getMyBills);

// Get single bill by ID
// GET /api/bills/:id
router.get("/:id", protect, getBillById);

// Cancel own order
// PUT /api/bills/:id/cancel
router.put("/:id/cancel", protect, cancelOrder);

// Admin/Warehouse Admin routes

// Get all orders with filters
// GET /api/bills?status=shipped&paymentStatus=paid&page=1&limit=10
router.get(
  "/",
  protect,
  hasAnyRole("admin", "warehouse_admin"),
  getAllBills
);

// Update order status
// PUT /api/bills/:id/order-status
// Body: { orderStatus: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" }
router.put(
  "/:id/order-status",
  protect,
  hasAnyRole("admin", "warehouse_admin"),
  updateOrderStatus
);

// Admin only routes

// Update payment status
// PUT /api/bills/:id/payment-status
// Body: { paymentStatus: "pending" | "paid" | "failed" }
router.put(
  "/:id/payment-status",
  protect,
  adminOnly,
  updatePaymentStatus
);

// Get order statistics
// GET /api/bills/admin/stats
router.get(
  "/admin/stats",
  protect,
  adminOnly,
  getOrderStats
);

export default router;