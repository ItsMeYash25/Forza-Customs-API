import asyncHandler from "express-async-handler";
import Service from "../models/serviceModel.js";

// @desc    Create new service appointment
// @route   POST /api/services
// @access  Private (optional user authentication)
const createAppointment = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    contactNumber,
    address,
    vehicleName,
    vehicleNumber,
    appointmentDate,
  } = req.body;

  // Validate required fields
  if (
    !firstName ||
    !lastName ||
    !email ||
    !contactNumber ||
    !address ||
    !vehicleName ||
    !vehicleNumber ||
    !appointmentDate
  ) {
    res.status(400);
    throw new Error("All fields are required");
  }

  // Validate email format
  const emailRegex = /\S+@\S+\.\S+/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error("Please provide a valid email address");
  }

  // Validate appointment date is in the future
  const appointmentDateObj = new Date(appointmentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (appointmentDateObj < today) {
    res.status(400);
    throw new Error("Appointment date must be today or in the future");
  }

  // Create service appointment
  const serviceData = {
    firstName,
    lastName,
    email,
    contactNumber,
    address,
    vehicleName,
    vehicleNumber,
    appointmentDate: appointmentDateObj,
    status: "Unseen",
    message: "Your appointment is not yet reviewed.",
  };

  // If user is authenticated, link appointment to user
  if (req.user) {
    serviceData.user = req.user._id;
  }

  const service = await Service.create(serviceData);

  res.status(201).json({
    message: "Service appointment created successfully",
    service,
  });
});

// @desc    Get all service appointments (Admin/Service Admin)
// @route   GET /api/services
// @access  Private/Admin/Service Admin
const getAllAppointments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10, search } = req.query;

  const filter = {};

  // Filter by status
  if (status) {
    filter.status = status;
  }

  // Search by vehicle number, name, or contact
  if (search) {
    filter.$or = [
      { vehicleNumber: { $regex: search, $options: "i" } },
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { contactNumber: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const appointments = await Service.find(filter)
    .populate("user", "username email contact")
    .sort({ appointmentDate: 1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Service.countDocuments(filter);

  res.status(200).json({
    appointments,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    totalAppointments: total,
  });
});

// @desc    Get user's own appointments
// @route   GET /api/services/my-appointments
// @access  Private
const getMyAppointments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const filter = { user: req.user._id };

  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const appointments = await Service.find(filter)
    .sort({ appointmentDate: 1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Service.countDocuments(filter);

  res.status(200).json({
    appointments,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    totalAppointments: total,
  });
});

// @desc    Get single appointment by ID
// @route   GET /api/services/:id
// @access  Public/Private (users can check their own)
const getAppointmentById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).populate(
    "user",
    "username email contact"
  );

  if (!service) {
    res.status(404);
    throw new Error("Service appointment not found");
  }

  // If user is authenticated, check authorization
  if (req.user) {
    const isOwner = service.user && service.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.hasRole("admin") || req.user.hasRole("service_admin");

    if (!isOwner && !isAdmin) {
      res.status(403);
      throw new Error("Not authorized to view this appointment");
    }
  }

  res.status(200).json(service);
});

// @desc    Check appointment status by ID (public)
// @route   POST /api/services/check-status
// @access  Public
const checkAppointmentStatus = asyncHandler(async (req, res) => {
  const { id, email } = req.body;

  if (!id || !email) {
    res.status(400);
    throw new Error("Appointment ID and email are required");
  }

  const service = await Service.findById(id);

  if (!service) {
    res.status(404);
    throw new Error("Service appointment not found");
  }

  // Verify email matches
  if (service.email.toLowerCase() !== email.toLowerCase()) {
    res.status(403);
    throw new Error("Email does not match appointment records");
  }

  res.status(200).json({
    id: service._id,
    firstName: service.firstName,
    lastName: service.lastName,
    vehicleName: service.vehicleName,
    vehicleNumber: service.vehicleNumber,
    appointmentDate: service.appointmentDate,
    status: service.status,
    message: service.message,
    createdAt: service.createdAt,
  });
});

// @desc    Update appointment status (Admin/Service Admin)
// @route   PUT /api/services/:id/status
// @access  Private/Admin/Service Admin
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, message } = req.body;

  const validStatuses = ["Unseen", "Confirmed", "In Progress", "Completed", "Cancelled"];

  if (!status || !validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  const service = await Service.findById(req.params.id);

  if (!service) {
    res.status(404);
    throw new Error("Service appointment not found");
  }

  service.status = status;

  if (message) {
    service.message = message;
  } else {
    // Default messages based on status
    const defaultMessages = {
      Unseen: "Your appointment is not yet reviewed.",
      Confirmed: "Your appointment has been confirmed. We'll see you soon!",
      "In Progress": "Your vehicle service is currently in progress.",
      Completed: "Your vehicle service has been completed. Thank you!",
      Cancelled: "Your appointment has been cancelled.",
    };
    service.message = defaultMessages[status];
  }

  await service.save();

  const updatedService = await Service.findById(service._id).populate(
    "user",
    "username email contact"
  );

  res.status(200).json({
    message: "Appointment status updated successfully",
    service: updatedService,
  });
});

// @desc    Update appointment details (before confirmation)
// @route   PUT /api/services/:id
// @access  Private
const updateAppointment = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    res.status(404);
    throw new Error("Service appointment not found");
  }

  // Check authorization
  const isOwner = service.user && service.user.toString() === req.user._id.toString();
  const isAdmin = req.user.hasRole("admin") || req.user.hasRole("service_admin");

  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to update this appointment");
  }

  // Only allow updates if status is Unseen or Confirmed
  if (!["Unseen", "Confirmed"].includes(service.status)) {
    res.status(400);
    throw new Error("Cannot update appointment that is in progress, completed, or cancelled");
  }

  const {
    firstName,
    lastName,
    email,
    contactNumber,
    address,
    vehicleName,
    vehicleNumber,
    appointmentDate,
  } = req.body;

  // Update fields
  if (firstName) service.firstName = firstName;
  if (lastName) service.lastName = lastName;
  if (email) service.email = email;
  if (contactNumber) service.contactNumber = contactNumber;
  if (address) service.address = address;
  if (vehicleName) service.vehicleName = vehicleName;
  if (vehicleNumber) service.vehicleNumber = vehicleNumber;

  if (appointmentDate) {
    const appointmentDateObj = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDateObj < today) {
      res.status(400);
      throw new Error("Appointment date must be today or in the future");
    }
    service.appointmentDate = appointmentDateObj;
  }

  await service.save();

  res.status(200).json({
    message: "Appointment updated successfully",
    service,
  });
});

// @desc    Cancel appointment (by user)
// @route   PUT /api/services/:id/cancel
// @access  Private
const cancelAppointment = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    res.status(404);
    throw new Error("Service appointment not found");
  }

  // Check if user owns this appointment
  if (!service.user || service.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to cancel this appointment");
  }

  // Can only cancel Unseen or Confirmed appointments
  if (!["Unseen", "Confirmed"].includes(service.status)) {
    res.status(400);
    throw new Error("Cannot cancel appointment that is in progress, completed, or already cancelled");
  }

  service.status = "Cancelled";
  service.message = "Appointment cancelled by user.";

  await service.save();

  res.status(200).json({
    message: "Appointment cancelled successfully",
    service,
  });
});

// @desc    Delete appointment (Admin only)
// @route   DELETE /api/services/:id
// @access  Private/Admin
const deleteAppointment = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    res.status(404);
    throw new Error("Service appointment not found");
  }

  await service.deleteOne();

  res.status(200).json({ message: "Appointment deleted successfully" });
});

// @desc    Get service statistics (Admin/Service Admin)
// @route   GET /api/services/stats
// @access  Private/Admin/Service Admin
const getServiceStats = asyncHandler(async (req, res) => {
  const totalAppointments = await Service.countDocuments();
  const unseenAppointments = await Service.countDocuments({ status: "Unseen" });
  const confirmedAppointments = await Service.countDocuments({ status: "Confirmed" });
  const inProgressAppointments = await Service.countDocuments({ status: "In Progress" });
  const completedAppointments = await Service.countDocuments({ status: "Completed" });
  const cancelledAppointments = await Service.countDocuments({ status: "Cancelled" });

  // Get upcoming appointments (next 7 days)
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const upcomingAppointments = await Service.countDocuments({
    appointmentDate: { $gte: today, $lte: nextWeek },
    status: { $in: ["Unseen", "Confirmed"] },
  });

  res.status(200).json({
    totalAppointments,
    appointmentsByStatus: {
      unseen: unseenAppointments,
      confirmed: confirmedAppointments,
      inProgress: inProgressAppointments,
      completed: completedAppointments,
      cancelled: cancelledAppointments,
    },
    upcomingAppointments,
  });
});

export {
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
};