import express from "express";
import {
  createAppointment,
  getAllAppointments,
  getMyAppointments,
  getAppointmentById,
  checkAppointmentStatus,
  updateAppointmentStatus,
  updateAppointment,
  cancelAppointment,
  deleteAppointment,
  getServiceStats,
} from "../controllers/serviceController.js";
import {
  protect,
  adminOnly,
  serviceAdminOnly,
  hasAnyRole,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes

// Check appointment status by ID and email
// POST /api/services/check-status
// Body: { id, email }
router.post("/check-status", checkAppointmentStatus);

// Protected routes - All authenticated users

// Create new service appointment
// POST /api/services
// Body: { firstName, lastName, email, contactNumber, address, vehicleName, vehicleNumber, appointmentDate }
router.post("/", protect, createAppointment);

// Get user's own appointments
// GET /api/services/my-appointments?status=Confirmed&page=1&limit=10
router.get("/my-appointments", protect, getMyAppointments);

// Get single appointment by ID
// GET /api/services/:id
router.get("/:id", protect, getAppointmentById);

// Update appointment details (before confirmation)
// PUT /api/services/:id
// Body: { firstName, lastName, email, contactNumber, address, vehicleName, vehicleNumber, appointmentDate }
router.put("/:id", protect, updateAppointment);

// Cancel appointment (by user)
// PUT /api/services/:id/cancel
router.put("/:id/cancel", protect, cancelAppointment);

// Admin/Service Admin routes

// Get all appointments with filters
// GET /api/services?status=Unseen&page=1&limit=10&search=vehicle123
router.get(
  "/",
  protect,
  hasAnyRole("admin", "service_admin"),
  getAllAppointments
);

// Update appointment status
// PUT /api/services/:id/status
// Body: { status: "Unseen" | "Confirmed" | "In Progress" | "Completed" | "Cancelled", message: "optional custom message" }
router.put(
  "/:id/status",
  protect,
  hasAnyRole("admin", "service_admin"),
  updateAppointmentStatus
);

// Get service statistics
// GET /api/services/admin/stats
router.get(
  "/admin/stats",
  protect,
  hasAnyRole("admin", "service_admin"),
  getServiceStats
);

// Admin only routes

// Delete appointment
// DELETE /api/services/:id
router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteAppointment
);

export default router;