import express from "express";
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    syncCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All cart routes require authentication
router.use(protect);

// Get user's cart
router.get("/", getCart);

// Add item to cart (body: { partId, qty })
router.post("/items", addToCart);

// Update cart item quantity
router.put("/items/:itemId", updateCartItem);

// Remove item from cart
router.delete("/items/:itemId", removeFromCart);

// Clear entire cart
router.delete("/", clearCart);

// Sync cart with latest product data
router.post("/sync", syncCart);

export default router;