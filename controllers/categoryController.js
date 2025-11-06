import asyncHandler from "express-async-handler";
import Category from "../models/categoryModel.js";
import Parts from "../models/partsModel.js";

// @desc   Get all categories
// route   GET /api/categories
// @access Public
const getAllCategories = asyncHandler(async (req, res) => {
    const { search } = req.query;

    const query = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];
    }

    const categories = await Category.find(query).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        categories,
    });
});

// @desc   Get category by ID
// route   GET /api/categories/:id
// @access Public
const getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
        res.status(404);
        throw new Error("Category not found");
    }

    // Get parts count for this category
    const partsCount = await Parts.countDocuments({ category: id });

    res.status(200).json({
        success: true,
        category,
        partsCount,
    });
});

// @desc   Create category
// route   POST /api/categories
// @access Private (Admin/Warehouse Admin)
const createCategory = asyncHandler(async (req, res) => {
    const { name, icon, description } = req.body;

    if (!name) {
        res.status(400);
        throw new Error("Please provide category name");
    }

    // Check if category already exists
    const categoryExists = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (categoryExists) {
        res.status(400);
        throw new Error("Category with this name already exists");
    }

    const categoryData = {
        name,
        icon: icon || "",
        description: description || "",
    };

    const category = await Category.create(categoryData);

    res.status(201).json({
        success: true,
        message: "Category created successfully",
        category,
    });
});

// @desc   Update category
// route   PUT /api/categories/:id
// @access Private (Admin/Warehouse Admin)
const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, icon, description } = req.body;

    const category = await Category.findById(id);

    if (!category) {
        res.status(404);
        throw new Error("Category not found");
    }

    // Check if new name already exists (excluding current category)
    if (name && name !== category.name) {
        const nameExists = await Category.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            _id: { $ne: id },
        });

        if (nameExists) {
            res.status(400);
            throw new Error("Category with this name already exists");
        }
    }

    // Update fields
    if (name) category.name = name;
    if (icon !== undefined) category.icon = icon;
    if (description !== undefined) category.description = description;

    await category.save();

    res.status(200).json({
        success: true,
        message: "Category updated successfully",
        category,
    });
});

// @desc   Delete category
// route   DELETE /api/categories/:id
// @access Private (Admin)
const deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
        res.status(404);
        throw new Error("Category not found");
    }

    // Check if category has associated parts
    const partsCount = await Parts.countDocuments({ category: id });

    if (partsCount > 0) {
        res.status(400);
        throw new Error(
            `Cannot delete category. It has ${partsCount} associated parts. Please reassign or delete those parts first.`
        );
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
        success: true,
        message: "Category deleted successfully",
    });
});

// @desc   Get categories with parts count
// route   GET /api/categories/with-count
// @access Public
const getCategoriesWithCount = asyncHandler(async (req, res) => {
    const categories = await Category.find().sort({ name: 1 });

    const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
            const partsCount = await Parts.countDocuments({
                category: category._id
            });

            return {
                ...category.toObject(),
                partsCount,
            };
        })
    );

    res.status(200).json({
        success: true,
        categories: categoriesWithCount,
    });
});

export {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesWithCount,
};