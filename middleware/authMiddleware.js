import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";

// Protect routes - verify token
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.userId).select("-password");

      if (!req.user) {
        res.status(401);
        throw new Error("User not found");
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

// Admin only middleware
const adminOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.hasRole("admin")) {
    next();
  } else {
    res.status(403);
    throw new Error("Access denied. Admin only.");
  }
});

// Warehouse admin middleware
const warehouseAdminOnly = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.hasRole("warehouse_admin") || req.user.hasRole("admin"))) {
    next();
  } else {
    res.status(403);
    throw new Error("Access denied. Warehouse admin only.");
  }
});

// Service admin middleware
const serviceAdminOnly = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.hasRole("service_admin") || req.user.hasRole("admin"))) {
    next();
  } else {
    res.status(403);
    throw new Error("Access denied. Service admin only.");
  }
});

// Check if user has any of the specified roles
const hasAnyRole = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (req.user && roles.some(role => req.user.hasRole(role))) {
      next();
    } else {
      res.status(403);
      throw new Error(`Access denied. Required roles: ${roles.join(", ")}`);
    }
  });
};

export {
  protect,
  adminOnly,
  warehouseAdminOnly,
  serviceAdminOnly,
  hasAnyRole
};