import asyncHandler from "express-async-handler";
import Deal from "../models/dealModel.js";
import Part from "../models/partsModel.js";

// @desc    Get all deals
// @route   GET /api/deals
// @access  Public
const getDeals = asyncHandler(async (req, res) => {
    const { active, page = 1, limit = 10 } = req.query;

    const query = {};

    // Filter by active status if provided
    if (active !== undefined) {
        query.active = active === "true";
    }

    const skip = (page - 1) * limit;

    const deals = await Deal.find(query)
        .populate("products", "name price discount poster")
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip);

    const total = await Deal.countDocuments(query);

    res.status(200).json({
        deals,
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalDeals: total,
    });
});

// @desc    Get active deals (for public display)
// @route   GET /api/deals/active
// @access  Public
const getActiveDeals = asyncHandler(async (req, res) => {
    const currentDate = new Date();

    const deals = await Deal.find({
        active: true,
        $or: [
            { validTill: { $gte: currentDate } },
            { validTill: null }
        ]
    })
        .populate("products", "name price discount poster")
        .sort({ createdAt: -1 });

    res.status(200).json({ deals });
});

// @desc    Get single deal by ID
// @route   GET /api/deals/:id
// @access  Public
const getDealById = asyncHandler(async (req, res) => {
    const deal = await Deal.findById(req.params.id).populate(
        "products",
        "name description price discount stock poster gallery"
    );

    if (!deal) {
        res.status(404);
        throw new Error("Deal not found");
    }

    res.status(200).json({ deal });
});

// @desc    Create new deal
// @route   POST /api/deals
// @access  Private/Admin
const createDeal = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        discountPercentage,
        products,
        bannerImage,
        validTill,
        active,
    } = req.body;

    // Validation
    if (!title || !discountPercentage) {
        res.status(400);
        throw new Error("Title and discount percentage are required");
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
        res.status(400);
        throw new Error("Discount percentage must be between 0 and 100");
    }

    // Verify products exist if provided
    if (products && products.length > 0) {
        const existingProducts = await Part.find({ _id: { $in: products } });
        if (existingProducts.length !== products.length) {
            res.status(400);
            throw new Error("One or more products not found");
        }
    }

    const deal = await Deal.create({
        title,
        description,
        discountPercentage,
        products: products || [],
        bannerImage,
        validTill,
        active: active !== undefined ? active : true,
    });

    const populatedDeal = await Deal.findById(deal._id).populate(
        "products",
        "name price discount poster"
    );

    res.status(201).json({ deal: populatedDeal });
});

// @desc    Update deal
// @route   PUT /api/deals/:id
// @access  Private/Admin
const updateDeal = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        discountPercentage,
        products,
        bannerImage,
        validTill,
        active,
    } = req.body;

    const deal = await Deal.findById(req.params.id);

    if (!deal) {
        res.status(404);
        throw new Error("Deal not found");
    }

    // Validate discount percentage if provided
    if (discountPercentage !== undefined) {
        if (discountPercentage < 0 || discountPercentage > 100) {
            res.status(400);
            throw new Error("Discount percentage must be between 0 and 100");
        }
    }

    // Verify products exist if provided
    if (products && products.length > 0) {
        const existingProducts = await Part.find({ _id: { $in: products } });
        if (existingProducts.length !== products.length) {
            res.status(400);
            throw new Error("One or more products not found");
        }
    }

    // Update fields
    if (title !== undefined) deal.title = title;
    if (description !== undefined) deal.description = description;
    if (discountPercentage !== undefined) deal.discountPercentage = discountPercentage;
    if (products !== undefined) deal.products = products;
    if (bannerImage !== undefined) deal.bannerImage = bannerImage;
    if (validTill !== undefined) deal.validTill = validTill;
    if (active !== undefined) deal.active = active;

    const updatedDeal = await deal.save();

    const populatedDeal = await Deal.findById(updatedDeal._id).populate(
        "products",
        "name price discount poster"
    );

    res.status(200).json({ deal: populatedDeal });
});

// @desc    Delete deal
// @route   DELETE /api/deals/:id
// @access  Private/Admin
const deleteDeal = asyncHandler(async (req, res) => {
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
        res.status(404);
        throw new Error("Deal not found");
    }

    await deal.deleteOne();

    res.status(200).json({ message: "Deal deleted successfully" });
});

// @desc    Add products to deal
// @route   POST /api/deals/:id/products
// @access  Private/Admin
const addProductsToDeal = asyncHandler(async (req, res) => {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        res.status(400);
        throw new Error("Product IDs array is required");
    }

    const deal = await Deal.findById(req.params.id);

    if (!deal) {
        res.status(404);
        throw new Error("Deal not found");
    }

    // Verify products exist
    const existingProducts = await Part.find({ _id: { $in: productIds } });
    if (existingProducts.length !== productIds.length) {
        res.status(400);
        throw new Error("One or more products not found");
    }

    // Add only new products (avoid duplicates)
    const newProducts = productIds.filter(
        (id) => !deal.products.includes(id)
    );

    deal.products.push(...newProducts);
    await deal.save();

    const updatedDeal = await Deal.findById(deal._id).populate(
        "products",
        "name price discount poster"
    );

    res.status(200).json({ deal: updatedDeal });
});

// @desc    Remove products from deal
// @route   DELETE /api/deals/:id/products
// @access  Private/Admin
const removeProductsFromDeal = asyncHandler(async (req, res) => {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        res.status(400);
        throw new Error("Product IDs array is required");
    }

    const deal = await Deal.findById(req.params.id);

    if (!deal) {
        res.status(404);
        throw new Error("Deal not found");
    }

    deal.products = deal.products.filter(
        (productId) => !productIds.includes(productId.toString())
    );

    await deal.save();

    const updatedDeal = await Deal.findById(deal._id).populate(
        "products",
        "name price discount poster"
    );

    res.status(200).json({ deal: updatedDeal });
});

// @desc    Toggle deal active status
// @route   PATCH /api/deals/:id/toggle-active
// @access  Private/Admin
const toggleDealActive = asyncHandler(async (req, res) => {
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
        res.status(404);
        throw new Error("Deal not found");
    }

    deal.active = !deal.active;
    await deal.save();

    const updatedDeal = await Deal.findById(deal._id).populate(
        "products",
        "name price discount poster"
    );

    res.status(200).json({ deal: updatedDeal });
});

export {
    getDeals,
    getActiveDeals,
    getDealById,
    createDeal,
    updateDeal,
    deleteDeal,
    addProductsToDeal,
    removeProductsFromDeal,
    toggleDealActive,
};