import asyncHandler from "express-async-handler";
import Parts from "../models/partsModel.js";
import { v2 as cloudinary } from "cloudinary";
import getDataUri from "../utils/dataUri.js";

// @desc   View All Parts
// route   GET /api/parts/
// @access Public
const viewAllParts = asyncHandler(async (req, res) => {
  const {
    category,
    featured,
    minPrice,
    maxPrice,
    search,
    tags,
    sort,
    page = 1,
    limit = 10,
  } = req.query;

  // Build query
  const query = {};

  if (category) query.category = category;
  if (featured !== undefined) query.featured = featured === "true";
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }
  if (tags) {
    const tagArray = tags.split(",");
    query.tags = { $in: tagArray };
  }

  // Sort options
  let sortOption = {};
  if (sort === "price_asc") sortOption.price = 1;
  else if (sort === "price_desc") sortOption.price = -1;
  else if (sort === "newest") sortOption.createdAt = -1;
  else if (sort === "oldest") sortOption.createdAt = 1;
  else if (sort === "name_asc") sortOption.name = 1;
  else if (sort === "name_desc") sortOption.name = -1;
  else sortOption.createdAt = -1; // default

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  const parts = await Parts.find(query)
    .populate("category", "name")
    .sort(sortOption)
    .skip(skip)
    .limit(Number(limit));

  const total = await Parts.countDocuments(query);

  res.status(200).json({
    success: true,
    parts,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      limit: Number(limit),
    },
  });
});

// @desc    View Part by id
// route    GET /api/parts/:id
// @access  Public
const viewPartsById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const part = await Parts.findById(id).populate("category", "name");

  if (!part) {
    res.status(404);
    throw new Error("Part not found");
  }

  res.status(200).json({
    success: true,
    part,
  });
});

// @desc   Add Car Parts
// route   POST /api/parts/add
// @access Private (Admin/Warehouse Admin)
const addParts = asyncHandler(async (req, res) => {
  const { name, description, category, price, stock, featured, discount, tags } = req.body;
  const file = req.file;

  if (!name || !category || !price) {
    res.status(400);
    throw new Error("Please provide name, category, and price");
  }

  let posterData = {};

  // Upload poster image if provided
  if (file) {
    const fileUri = getDataUri(file);
    const myCloud = await cloudinary.uploader.upload(fileUri.content, {
      folder: "parts_posters",
      width: 500,
      height: 500,
      crop: "fill",
    });

    posterData = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }

  const partData = {
    name,
    description: description || "",
    category,
    price: Number(price),
    stock: stock ? Number(stock) : 0,
    featured: featured === "true" || featured === true,
    discount: discount ? Number(discount) : 0,
    poster: posterData,
  };

  // Parse tags if provided as string
  if (tags) {
    partData.tags = typeof tags === "string" ? tags.split(",").map(tag => tag.trim()) : tags;
  }

  const partDoc = await Parts.create(partData);

  res.status(201).json({
    success: true,
    message: "Part added successfully",
    part: partDoc,
  });
});

// @desc    Update Parts by Id
// route    PUT /api/parts/update/:id
// @access  Private (Admin/Warehouse Admin)
const updateParts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, category, price, stock, featured, discount, tags } = req.body;

  const part = await Parts.findById(id);

  if (!part) {
    res.status(404);
    throw new Error("Part not found");
  }

  // Update fields
  if (name) part.name = name;
  if (description !== undefined) part.description = description;
  if (category) part.category = category;
  if (price) part.price = Number(price);
  if (stock !== undefined) part.stock = Number(stock);
  if (featured !== undefined) part.featured = featured === "true" || featured === true;
  if (discount !== undefined) part.discount = Number(discount);
  if (tags) {
    part.tags = typeof tags === "string" ? tags.split(",").map(tag => tag.trim()) : tags;
  }

  // Update poster if new file is provided
  if (req.file) {
    // Delete old poster if exists
    if (part.poster && part.poster.public_id) {
      await cloudinary.uploader.destroy(part.poster.public_id);
    }

    const fileUri = getDataUri(req.file);
    const myCloud = await cloudinary.uploader.upload(fileUri.content, {
      folder: "parts_posters",
      width: 500,
      height: 500,
      crop: "fill",
    });

    part.poster = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }

  await part.save();

  res.status(200).json({
    success: true,
    message: "Part updated successfully",
    part,
  });
});

// @desc    Delete Parts by Id
// route    DELETE /api/parts/delete/:id
// @access  Private (Admin/Warehouse Admin)
const deleteParts = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const part = await Parts.findById(id);

  if (!part) {
    res.status(404);
    throw new Error("Part not found");
  }

  // Delete poster from cloudinary if exists
  if (part.poster && part.poster.public_id) {
    await cloudinary.uploader.destroy(part.poster.public_id);
  }

  // Delete all gallery images from cloudinary
  if (part.gallery && part.gallery.length > 0) {
    for (const image of part.gallery) {
      if (image.public_id) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }
  }

  await Parts.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Part deleted successfully",
  });
});

// @desc    Add images to gallery
// route    POST /api/parts/:id/gallery
// @access  Private (Admin/Warehouse Admin)
const addGalleryImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const files = req.files;

  if (!files || files.length === 0) {
    res.status(400);
    throw new Error("Please upload at least one image");
  }

  const part = await Parts.findById(id);

  if (!part) {
    res.status(404);
    throw new Error("Part not found");
  }

  // Upload images to cloudinary
  const uploadPromises = files.map(async (file) => {
    const fileUri = getDataUri(file);
    const myCloud = await cloudinary.uploader.upload(fileUri.content, {
      folder: "parts_gallery",
      width: 800,
      height: 800,
      crop: "fill",
    });

    return {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  });

  const uploadedImages = await Promise.all(uploadPromises);

  // Add to gallery
  part.gallery.push(...uploadedImages);
  await part.save();

  res.status(200).json({
    success: true,
    message: "Images added to gallery successfully",
    gallery: part.gallery,
  });
});

// @desc    Delete image from gallery
// route    DELETE /api/parts/:id/gallery/:imageId
// @access  Private (Admin/Warehouse Admin)
const deleteGalleryImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;

  const part = await Parts.findById(id);

  if (!part) {
    res.status(404);
    throw new Error("Part not found");
  }

  const image = part.gallery.id(imageId);

  if (!image) {
    res.status(404);
    throw new Error("Image not found in gallery");
  }

  // Delete from cloudinary
  if (image.public_id) {
    await cloudinary.uploader.destroy(image.public_id);
  }

  // Remove from gallery
  part.gallery = part.gallery.filter(
    img => img._id.toString() !== imageId
  );

  await part.save();

  res.status(200).json({
    success: true,
    message: "Image deleted from gallery successfully",
    gallery: part.gallery,
  });
});

// @desc    Update stock
// route    PATCH /api/parts/:id/stock
// @access  Private (Admin/Warehouse Admin)
const updateStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  if (stock === undefined || stock === null) {
    res.status(400);
    throw new Error("Please provide stock value");
  }

  const part = await Parts.findById(id);

  if (!part) {
    res.status(404);
    throw new Error("Part not found");
  }

  part.stock = Number(stock);
  await part.save();

  res.status(200).json({
    success: true,
    message: "Stock updated successfully",
    part,
  });
});

// @desc    Get featured parts
// route    GET /api/parts/featured
// @access  Public
const getFeaturedParts = asyncHandler(async (req, res) => {
  const parts = await Parts.find({ featured: true })
    .populate("category", "name")
    .limit(10)
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    parts,
  });
});

export {
  viewAllParts,
  viewPartsById,
  addParts,
  updateParts,
  deleteParts,
  addGalleryImages,
  deleteGalleryImage,
  updateStock,
  getFeaturedParts,
};