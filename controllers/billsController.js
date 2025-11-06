import asyncHandler from "express-async-handler";
import Bill from "../models/billModel.js";
import Cart from "../models/cartModel.js";
import Part from "../models/partsModel.js";

// @desc    Create new order/bill from cart
// @route   POST /api/bills
// @access  Private
const createBill = asyncHandler(async (req, res) => {
  const { contact, paymentMethod } = req.body;

  // Validate contact information
  if (!contact || !contact.name || !contact.email || !contact.phone || !contact.address) {
    res.status(400);
    throw new Error("All contact fields are required");
  }

  // Get user's cart
  const cart = await Cart.findOne({ user: req.user._id }).populate("cart.part");

  if (!cart || cart.cart.length === 0) {
    res.status(400);
    throw new Error("Cart is empty");
  }

  // Validate stock availability for all items
  for (const item of cart.cart) {
    const part = await Part.findById(item.part._id);

    if (!part) {
      res.status(404);
      throw new Error(`Part ${item.name} not found`);
    }

    if (part.stock < item.qty) {
      res.status(400);
      throw new Error(`Insufficient stock for ${item.name}. Only ${part.stock} available`);
    }
  }

  // Create bill
  const bill = await Bill.create({
    user: req.user._id,
    contact: {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
    },
    cart: cart.cart.map(item => ({
      part: item.part._id,
      name: item.name,
      price: item.price,
      qty: item.qty,
      total: item.total,
    })),
    totalCost: cart.totalCost,
    paymentMethod: paymentMethod || "cod",
    paymentStatus: paymentMethod === "online" ? "pending" : "pending",
    orderStatus: "pending",
  });

  // Reduce stock for each part
  for (const item of cart.cart) {
    await Part.findByIdAndUpdate(
      item.part._id,
      { $inc: { stock: -item.qty } }
    );
  }

  // Clear user's cart
  cart.cart = [];
  cart.totalCost = 0;
  await cart.save();

  const populatedBill = await Bill.findById(bill._id)
    .populate("user", "username email")
    .populate("cart.part");

  res.status(201).json({
    message: "Order placed successfully",
    bill: populatedBill,
  });
});

// @desc    Get all bills (Admin/Warehouse Admin)
// @route   GET /api/bills
// @access  Private/Admin
const getAllBills = asyncHandler(async (req, res) => {
  const { status, paymentStatus, page = 1, limit = 10 } = req.query;

  const filter = {};

  if (status) {
    filter.orderStatus = status;
  }

  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }

  const skip = (page - 1) * limit;

  const bills = await Bill.find(filter)
    .populate("user", "username email contact")
    .populate("cart.part")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Bill.countDocuments(filter);

  res.status(200).json({
    bills,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    totalBills: total,
  });
});

// @desc    Get user's own bills
// @route   GET /api/bills/my-orders
// @access  Private
const getMyBills = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const filter = { user: req.user._id };

  if (status) {
    filter.orderStatus = status;
  }

  const skip = (page - 1) * limit;

  const bills = await Bill.find(filter)
    .populate("cart.part")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Bill.countDocuments(filter);

  res.status(200).json({
    bills,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    totalBills: total,
  });
});

// @desc    Get single bill by ID
// @route   GET /api/bills/:id
// @access  Private
const getBillById = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id)
    .populate("user", "username email contact")
    .populate("cart.part");

  if (!bill) {
    res.status(404);
    throw new Error("Bill not found");
  }

  // Users can only view their own bills, admins can view all
  if (
    bill.user._id.toString() !== req.user._id.toString() &&
    !req.user.hasRole("admin") &&
    !req.user.hasRole("warehouse_admin")
  ) {
    res.status(403);
    throw new Error("Not authorized to view this bill");
  }

  res.status(200).json(bill);
});

// @desc    Update order status
// @route   PUT /api/bills/:id/order-status
// @access  Private/Admin/Warehouse Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;

  const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

  if (!orderStatus || !validStatuses.includes(orderStatus)) {
    res.status(400);
    throw new Error(`Invalid order status. Must be one of: ${validStatuses.join(", ")}`);
  }

  const bill = await Bill.findById(req.params.id);

  if (!bill) {
    res.status(404);
    throw new Error("Bill not found");
  }

  // If cancelling order, restore stock
  if (orderStatus === "cancelled" && bill.orderStatus !== "cancelled") {
    for (const item of bill.cart) {
      await Part.findByIdAndUpdate(
        item.part,
        { $inc: { stock: item.qty } }
      );
    }
  }

  bill.orderStatus = orderStatus;
  await bill.save();

  const updatedBill = await Bill.findById(bill._id)
    .populate("user", "username email")
    .populate("cart.part");

  res.status(200).json({
    message: "Order status updated successfully",
    bill: updatedBill,
  });
});

// @desc    Update payment status
// @route   PUT /api/bills/:id/payment-status
// @access  Private/Admin
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus } = req.body;

  const validStatuses = ["pending", "paid", "failed"];

  if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
    res.status(400);
    throw new Error(`Invalid payment status. Must be one of: ${validStatuses.join(", ")}`);
  }

  const bill = await Bill.findById(req.params.id);

  if (!bill) {
    res.status(404);
    throw new Error("Bill not found");
  }

  bill.paymentStatus = paymentStatus;

  // Auto-confirm order when payment is successful
  if (paymentStatus === "paid" && bill.orderStatus === "pending") {
    bill.orderStatus = "confirmed";
  }

  await bill.save();

  const updatedBill = await Bill.findById(bill._id)
    .populate("user", "username email")
    .populate("cart.part");

  res.status(200).json({
    message: "Payment status updated successfully",
    bill: updatedBill,
  });
});

// @desc    Cancel order (by user)
// @route   PUT /api/bills/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id);

  if (!bill) {
    res.status(404);
    throw new Error("Bill not found");
  }

  // Check if user owns this bill
  if (bill.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to cancel this order");
  }

  // Can only cancel pending or confirmed orders
  if (!["pending", "confirmed"].includes(bill.orderStatus)) {
    res.status(400);
    throw new Error("Cannot cancel order that is already shipped or delivered");
  }

  // Restore stock
  for (const item of bill.cart) {
    await Part.findByIdAndUpdate(
      item.part,
      { $inc: { stock: item.qty } }
    );
  }

  bill.orderStatus = "cancelled";
  await bill.save();

  const updatedBill = await Bill.findById(bill._id)
    .populate("cart.part");

  res.status(200).json({
    message: "Order cancelled successfully",
    bill: updatedBill,
  });
});

// @desc    Get order statistics (Admin)
// @route   GET /api/bills/stats
// @access  Private/Admin
const getOrderStats = asyncHandler(async (req, res) => {
  const totalOrders = await Bill.countDocuments();
  const pendingOrders = await Bill.countDocuments({ orderStatus: "pending" });
  const confirmedOrders = await Bill.countDocuments({ orderStatus: "confirmed" });
  const shippedOrders = await Bill.countDocuments({ orderStatus: "shipped" });
  const deliveredOrders = await Bill.countDocuments({ orderStatus: "delivered" });
  const cancelledOrders = await Bill.countDocuments({ orderStatus: "cancelled" });

  const totalRevenue = await Bill.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $group: { _id: null, total: { $sum: "$totalCost" } } },
  ]);

  const pendingPayments = await Bill.aggregate([
    { $match: { paymentStatus: "pending" } },
    { $group: { _id: null, total: { $sum: "$totalCost" } } },
  ]);

  res.status(200).json({
    totalOrders,
    ordersByStatus: {
      pending: pendingOrders,
      confirmed: confirmedOrders,
      shipped: shippedOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders,
    },
    revenue: {
      total: totalRevenue[0]?.total || 0,
      pending: pendingPayments[0]?.total || 0,
    },
  });
});

export {
  createBill,
  getAllBills,
  getMyBills,
  getBillById,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  getOrderStats,
};