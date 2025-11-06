import asyncHandler from "express-async-handler";
import Banner from "../models/bannerModel.js";
import { v2 as cloudinary } from "cloudinary";
import getDataUri from "../utils/dataUri.js";

// @desc    Get all banners
// @route   GET /api/banners
// @access  Public
const getBanners = asyncHandler(async (req, res) => {
    const { active, page = 1, limit = 10 } = req.query;

    const query = {};

    // Filter by active status if provided
    if (active !== undefined) {
        query.active = active === "true";
    }

    const skip = (page - 1) * limit;

    const banners = await Banner.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip);

    const total = await Banner.countDocuments(query);

    res.status(200).json({
        banners,
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalBanners: total,
    });
});

// @desc    Get active banners (for public display)
// @route   GET /api/banners/active
// @access  Public
const getActiveBanners = asyncHandler(async (req, res) => {
    const banners = await Banner.find({ active: true }).sort({ createdAt: -1 });

    res.status(200).json({ banners });
});

// @desc    Get single banner by ID
// @route   GET /api/banners/:id
// @access  Public
const getBannerById = asyncHandler(async (req, res) => {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
        res.status(404);
        throw new Error("Banner not found");
    }

    res.status(200).json({ banner });
});

// @desc    Create new banner
// @route   POST /api/banners
// @access  Private/Admin
const createBanner = asyncHandler(async (req, res) => {
    const { title, subtitle, ctaText, ctaLink, active } = req.body;

    // Validation
    if (!title) {
        res.status(400);
        throw new Error("Title is required");
    }

    if (!req.file) {
        res.status(400);
        throw new Error("Banner image is required");
    }

    // Upload image to Cloudinary
    const fileUri = getDataUri(req.file);
    const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
        folder: "banners",
    });

    const banner = await Banner.create({
        title,
        subtitle,
        image: {
            public_id: cloudResponse.public_id,
            url: cloudResponse.secure_url,
        },
        ctaText: ctaText || "Shop Now",
        ctaLink: ctaLink || "/shop",
        active: active !== undefined ? active : true,
    });

    res.status(201).json({ banner });
});

// @desc    Update banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
const updateBanner = asyncHandler(async (req, res) => {
    const { title, subtitle, ctaText, ctaLink, active } = req.body;

    const banner = await Banner.findById(req.params.id);

    if (!banner) {
        res.status(404);
        throw new Error("Banner not found");
    }

    // Handle image update if new file is provided
    if (req.file) {
        // Delete old image from Cloudinary
        if (banner.image?.public_id) {
            await cloudinary.uploader.destroy(banner.image.public_id);
        }

        // Upload new image
        const fileUri = getDataUri(req.file);
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
            folder: "banners",
        });

        banner.image = {
            public_id: cloudResponse.public_id,
            url: cloudResponse.secure_url,
        };
    }

    // Update other fields
    if (title !== undefined) banner.title = title;
    if (subtitle !== undefined) banner.subtitle = subtitle;
    if (ctaText !== undefined) banner.ctaText = ctaText;
    if (ctaLink !== undefined) banner.ctaLink = ctaLink;
    if (active !== undefined) banner.active = active;

    const updatedBanner = await banner.save();

    res.status(200).json({ banner: updatedBanner });
});

// @desc    Delete banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
const deleteBanner = asyncHandler(async (req, res) => {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
        res.status(404);
        throw new Error("Banner not found");
    }

    // Delete image from Cloudinary
    if (banner.image?.public_id) {
        await cloudinary.uploader.destroy(banner.image.public_id);
    }

    await banner.deleteOne();

    res.status(200).json({ message: "Banner deleted successfully" });
});

// @desc    Toggle banner active status
// @route   PATCH /api/banners/:id/toggle-active
// @access  Private/Admin
const toggleBannerActive = asyncHandler(async (req, res) => {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
        res.status(404);
        throw new Error("Banner not found");
    }

    banner.active = !banner.active;
    await banner.save();

    res.status(200).json({ banner });
});

// @desc    Bulk delete banners
// @route   POST /api/banners/bulk-delete
// @access  Private/Admin
const bulkDeleteBanners = asyncHandler(async (req, res) => {
    const { bannerIds } = req.body;

    if (!bannerIds || !Array.isArray(bannerIds) || bannerIds.length === 0) {
        res.status(400);
        throw new Error("Banner IDs array is required");
    }

    // Get all banners to delete their images
    const banners = await Banner.find({ _id: { $in: bannerIds } });

    // Delete images from Cloudinary
    const deletePromises = banners.map((banner) => {
        if (banner.image?.public_id) {
            return cloudinary.uploader.destroy(banner.image.public_id);
        }
    });

    await Promise.all(deletePromises);

    // Delete banners from database
    const result = await Banner.deleteMany({ _id: { $in: bannerIds } });

    res.status(200).json({
        message: `${result.deletedCount} banner(s) deleted successfully`,
        deletedCount: result.deletedCount,
    });
});

// @desc    Bulk toggle active status
// @route   PATCH /api/banners/bulk-toggle
// @access  Private/Admin
const bulkToggleActive = asyncHandler(async (req, res) => {
    const { bannerIds, active } = req.body;

    if (!bannerIds || !Array.isArray(bannerIds) || bannerIds.length === 0) {
        res.status(400);
        throw new Error("Banner IDs array is required");
    }

    if (active === undefined) {
        res.status(400);
        throw new Error("Active status is required");
    }

    const result = await Banner.updateMany(
        { _id: { $in: bannerIds } },
        { active }
    );

    res.status(200).json({
        message: `${result.modifiedCount} banner(s) updated successfully`,
        modifiedCount: result.modifiedCount,
    });
});

export {
    getBanners,
    getActiveBanners,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBannerActive,
    bulkDeleteBanners,
    bulkToggleActive,
};