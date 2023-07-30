import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";
// @desc   Register User
// route   POST /api/users/register
// @access Public
const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(401).json({message:"User already exists"});
    // throw new Error("User already exists");
  }
  const user = await User.create({
    username,
    email,
    password,
  });
  if (user) {
    const token = generateToken(res, user._id);
    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
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
  if (user && (await user.checkPassword(password))) {
    const token = generateToken(res, user._id);
    res.status(201).json({
      id: user._id,
      username: user.username,
      email: user.email,
      admin: user.isAdmin,
      warehouse: user.isWarehouseAdmin,
      service: user.isServiceAdmin,
      token: token,
    });
  } else {
    res.status(401).json({message : "Invalid email or password"});
    // throw new Error("Invalid email or password");
  }
});
// @desc    get User Profile
// route    POST /api/users/profile
// @access  Private
const profile = asyncHandler(async (req, res) => {
  const user = {
    id: req.user._id,
    email: req.user.email,
    username: req.user.username,
    admin: req.user.isAdmin,
    warehouse: req.user.isWarehouseAdmin,
    service: req.user.isServiceAdmin,
  };
  res.status(200).json(user);
});
// @desc   View All Users
// route   GET /api/users/
// @access Private
const viewAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  if (users) {
    res.status(200).json(users);
  } else {
    res.status(404).json({ message: "There is not Users in the database" });
  }
});

export { login, register, profile, viewAllUsers };
