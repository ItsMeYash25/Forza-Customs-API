import asyncHandler from "express-async-handler";
import Cart from "../models/cartModel.js";
import Part from "../models/partsModel.js";

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ user: req.user._id }).populate(
        "cart.part",
        "name price stock"
    );

    if (!cart) {
        cart = await Cart.create({
            user: req.user._id,
            cart: [],
            totalCost: 0,
        });
    }

    res.status(200).json(cart);
});

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
    const { partId, qty } = req.body;

    if (!partId || !qty || qty < 1) {
        res.status(400);
        throw new Error("Part ID and valid quantity are required");
    }

    // Check if part exists
    const part = await Part.findById(partId);
    if (!part) {
        res.status(404);
        throw new Error("Part not found");
    }

    // Check stock availability
    if (part.stock < qty) {
        res.status(400);
        throw new Error(`Only ${part.stock} items available in stock`);
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        cart = await Cart.create({
            user: req.user._id,
            cart: [],
            totalCost: 0,
        });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.cart.findIndex(
        (item) => item.part.toString() === partId
    );

    if (existingItemIndex > -1) {
        // Update quantity if item exists
        const newQty = cart.cart[existingItemIndex].qty + qty;

        if (part.stock < newQty) {
            res.status(400);
            throw new Error(`Cannot add more. Only ${part.stock} items available`);
        }

        cart.cart[existingItemIndex].qty = newQty;
        cart.cart[existingItemIndex].total = newQty * part.price;
    } else {
        // Add new item
        cart.cart.push({
            part: part._id,
            name: part.name,
            price: part.price,
            qty,
            total: part.price * qty,
        });
    }

    // Recalculate total cost
    cart.totalCost = cart.cart.reduce((sum, item) => sum + item.total, 0);

    await cart.save();

    cart = await Cart.findById(cart._id).populate(
        "cart.part",
        "name price stock"
    );

    res.status(200).json(cart);
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:itemId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { qty } = req.body;

    if (!qty || qty < 1) {
        res.status(400);
        throw new Error("Valid quantity is required");
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        res.status(404);
        throw new Error("Cart not found");
    }

    const itemIndex = cart.cart.findIndex(
        (item) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
        res.status(404);
        throw new Error("Item not found in cart");
    }

    // Check part stock
    const part = await Part.findById(cart.cart[itemIndex].part);
    if (!part) {
        res.status(404);
        throw new Error("Part not found");
    }

    if (part.stock < qty) {
        res.status(400);
        throw new Error(`Only ${part.stock} items available in stock`);
    }

    // Update item
    cart.cart[itemIndex].qty = qty;
    cart.cart[itemIndex].price = part.price;
    cart.cart[itemIndex].total = qty * part.price;

    // Recalculate total cost
    cart.totalCost = cart.cart.reduce((sum, item) => sum + item.total, 0);

    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate(
        "cart.part",
        "name price stock"
    );

    res.status(200).json(updatedCart);
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        res.status(404);
        throw new Error("Cart not found");
    }

    const itemIndex = cart.cart.findIndex(
        (item) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
        res.status(404);
        throw new Error("Item not found in cart");
    }

    // Remove item
    cart.cart.splice(itemIndex, 1);

    // Recalculate total cost
    cart.totalCost = cart.cart.reduce((sum, item) => sum + item.total, 0);

    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate(
        "cart.part",
        "name price stock"
    );

    res.status(200).json(updatedCart);
});

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        res.status(404);
        throw new Error("Cart not found");
    }

    cart.cart = [];
    cart.totalCost = 0;

    await cart.save();

    res.status(200).json({ message: "Cart cleared successfully", cart });
});

// @desc    Sync cart with latest part prices
// @route   POST /api/cart/sync
// @access  Private
const syncCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart || cart.cart.length === 0) {
        res.status(404);
        throw new Error("Cart is empty");
    }

    let hasChanges = false;

    // Update prices and check availability
    for (let i = cart.cart.length - 1; i >= 0; i--) {
        const item = cart.cart[i];
        const part = await Part.findById(item.part);

        if (!part) {
            // Remove item if part no longer exists
            cart.cart.splice(i, 1);
            hasChanges = true;
            continue;
        }

        // Update price if changed
        if (item.price !== part.price) {
            item.price = part.price;
            item.total = item.qty * part.price;
            hasChanges = true;
        }

        // Update name if changed
        if (item.name !== part.name) {
            item.name = part.name;
            hasChanges = true;
        }

        // Adjust quantity if exceeds stock
        if (item.qty > part.stock) {
            if (part.stock === 0) {
                cart.cart.splice(i, 1);
            } else {
                item.qty = part.stock;
                item.total = item.qty * part.price;
            }
            hasChanges = true;
        }
    }

    // Recalculate total cost
    cart.totalCost = cart.cart.reduce((sum, item) => sum + item.total, 0);

    if (hasChanges) {
        await cart.save();
    }

    const updatedCart = await Cart.findById(cart._id).populate(
        "cart.part",
        "name price stock"
    );

    res.status(200).json({
        message: hasChanges ? "Cart synced with latest data" : "Cart is up to date",
        cart: updatedCart,
    });
});

export {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    syncCart,
};