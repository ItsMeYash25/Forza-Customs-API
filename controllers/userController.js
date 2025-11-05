import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";
import { v2 as cloudinary } from "cloudinary";
import getDataUri from "../utils/dataUri.js";

// @desc   Register User
// route   POST /api/users/register
// @access Public
const register = asyncHandler(async (req, res) => {
  const { username, email, password, contact, role } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(401).json({ message: "User already exists" });
    return;
  }

  // Only allow role assignment if it's provided and valid
  // You might want to restrict this based on who's creating the user
  const userData = {
    username,
    email,
    password,
  };

  if (contact) userData.contact = contact;
  if (role && ["user", "admin", "warehouse_admin", "service_admin"].includes(role)) {
    userData.role = role;
  }

  const user = await User.create(userData);

  if (user) {
    const token = generateToken(res, user._id);
    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc   Login User
// route   POST /api/users/login
// @access Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.comparePassword(password))) {
    const token = generateToken(res, user._id);
    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      contact: user.contact,
      role: user.role,
      isVerified: user.isVerified,
      avatar: user.avatar,
      token: token,
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
});

// @desc    Get User Profile
// route    GET /api/users/profile
// @access  Private
const profile = asyncHandler(async (req, res) => {
  const user = {
    id: req.user._id,
    email: req.user.email,
    username: req.user.username,
    contact: req.user.contact,
    role: req.user.role,
    isVerified: req.user.isVerified,
    addresses: req.user.addresses,
    avatar: req.user.avatar,
  };

  res.status(200).json(user);
});

// @desc   View All Users
// route   GET /api/users/
// @access Private (should be admin only)
const viewAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");

  if (users && users.length > 0) {
    res.status(200).json(users);
  } else {
    res.status(404).json({ message: "There are no users in the database" });
  }
});

// @desc   Update User Profile
// route   PUT /api/users/profile
// @access Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.contact = req.body.contact || user.contact;

    if (req.body.password) {
      user.password = req.body.password;
    }

    // Handle avatar upload
    if (req.file) {
      // Delete old avatar from cloudinary if exists
      if (user.avatar && user.avatar.public_id) {
        await cloudinary.uploader.destroy(user.avatar.public_id);
      }

      // Upload new avatar
      const fileUri = getDataUri(req.file);
      const myCloud = await cloudinary.uploader.upload(fileUri.content, {
        folder: "user_avatars",
        width: 250,
        height: 250,
        crop: "fill",
      });

      user.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    const updatedUser = await user.save();

    res.json({
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      contact: updatedUser.contact,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc   Upload/Update Avatar
// route   PUT /api/users/avatar
// @access Private
const updateAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!req.file) {
    res.status(400);
    throw new Error("Please upload an image file");
  }

  // Delete old avatar from cloudinary if exists
  if (user.avatar && user.avatar.public_id) {
    await cloudinary.uploader.destroy(user.avatar.public_id);
  }

  // Upload new avatar
  const fileUri = getDataUri(req.file);
  const myCloud = await cloudinary.uploader.upload(fileUri.content, {
    folder: "user_avatars",
    width: 250,
    height: 250,
    crop: "fill",
  });

  user.avatar = {
    public_id: myCloud.public_id,
    url: myCloud.secure_url,
  };

  await user.save();

  res.json({
    message: "Avatar updated successfully",
    avatar: user.avatar,
  });
});

// @desc   Delete Avatar
// route   DELETE /api/users/avatar
// @access Private
const deleteAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.avatar && user.avatar.public_id) {
    await cloudinary.uploader.destroy(user.avatar.public_id);
    user.avatar = {
      public_id: undefined,
      url: undefined,
    };
    await user.save();
  }

  res.json({ message: "Avatar deleted successfully" });
});

// @desc   Add Address
// route   POST /api/users/address
// @access Private
const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { label, fullName, phone, addressLine1, addressLine2, city, state, postalCode, isDefault } = req.body;

    // If this address is set as default, remove default from others
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      isDefault,
    });

    await user.save();
    res.status(201).json(user.addresses);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc   Update Address
// route   PUT /api/users/address/:addressId
// @access Private
const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const address = user.addresses.id(req.params.addressId);

    if (address) {
      // If setting as default, remove default from others
      if (req.body.isDefault) {
        user.addresses.forEach(addr => addr.isDefault = false);
      }

      Object.assign(address, req.body);
      await user.save();
      res.json(user.addresses);
    } else {
      res.status(404);
      throw new Error("Address not found");
    }
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc   Delete Address
// route   DELETE /api/users/address/:addressId
// @access Private
const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.addresses = user.addresses.filter(
      addr => addr._id.toString() !== req.params.addressId
    );

    await user.save();
    res.json(user.addresses);
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export {
  login,
  register,
  profile,
  updateProfile,
  updateAvatar,
  deleteAvatar,
  viewAllUsers,
  addAddress,
  updateAddress,
  deleteAddress
};