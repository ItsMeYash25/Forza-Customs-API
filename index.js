import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import partRoutes from "./routes/partRoutes.js";
import billRoutes from "./routes/billRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import dotenv from "dotenv";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import path from "path";
import { dirname } from "path";

// Config File
dotenv.config();
connectDB();

// Initialization
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const port = process.env.PORT || 4000;
const app = express();

// Inbuilt Middleware
app.use(express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static("uploads"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({ origin: "https://forza-customs.vercel.app/", withCredentials: true })
);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/parts", partRoutes);
app.use("/api/bill", billRoutes);
app.use("/api/service", serviceRoutes);

// Middleware
app.use(notFound);
app.use(errorHandler);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
