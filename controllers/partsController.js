import asyncHandler from "express-async-handler";
import Parts from "../models/partsModel.js";
import fs from "fs";
import { storage } from "../config/firebase.config.js";
import { ref, uploadBytes } from "firebase/storage";
// @desc   View All Parts
// route   GET /api/parts/
// @access Private
const viewAllParts = asyncHandler(async (req, res) => {
  const parts = await Parts.find();
  res.status(200).json({ message: "view all parts", parts });
});

// @desc    View Part by id
// route    GET /api/parts/id
// @access  Private
const viewPartsById = asyncHandler(async (req, res) => {
  res.json({ message: "view parts by id" });
});

// @desc   Add Car Parts
// route   POST /api/parts/add
// @access Private
const addParts = asyncHandler(async (req, res) => {
  const data = req.body;

  const storageRef = ref(storage, req.file.originalname);
  uploadBytes(storageRef, req.file.buffer);
  const { originalname, path } = req.file;
  const { name, price } = data;
  const partDoc = await Parts.create({ name, price, imageURL: newPath });
  res.status(201).json({ message: "part added successfully", partDoc });
});

// @desc    Update Parts by Id
// route    PUT /api/parts/update/id
// @access  Private
const updateParts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, price } = req.body;
  const partDoc = await Parts.updateOne(
    { _id: id },
    { name: name, price: price }
  );
  if (partDoc) {
    res.status(200).json({ message: "Part Updated Successfully" });
  } else {
    res.json({ message: "Something went wrong" });
  }
});

// @desc    Delete Parts by Id
// route    DELETE /api/parts/delete/id
// @access  Private
const deleteParts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const partDoc = await Parts.findByIdAndDelete(id);
  if (partDoc) {
    res.status(202).json({ message: "part deleted successfully" });
  }
});

export { viewAllParts, viewPartsById, addParts, updateParts, deleteParts };
