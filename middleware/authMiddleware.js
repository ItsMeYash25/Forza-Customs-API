import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";

const protect = asyncHandler(async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "Authorization token required" });
  }
  const token = authorization.split(" ")[1];
  try {
    const { userId } = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = await User.findById({ _id: userId }).select("-password");
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ error: "request is not authorized" });
  }
});

export { protect };
