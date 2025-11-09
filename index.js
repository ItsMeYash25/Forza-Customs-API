import express from "express";
import cors from "cors";
import "./cronJobs/cleanupSessions.js";
import userRoutes from "./routes/userRoutes.js";
import partRoutes from "./routes/partRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import dealRoutes from "./routes/dealRoutes.js";
import billRoutes from "./routes/billRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import dotenv from "dotenv";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import { v2 as cloudinary } from "cloudinary";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

// ------------------- CONFIG -------------------
dotenv.config();
connectDB();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

// ------------------- INIT -------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const port = process.env.PORT || 4000;
const app = express();

// ------------------- MIDDLEWARE -------------------
app.use(express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static("uploads"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    // origin: ["https://forza-customs.vercel.app", "*"],
    credentials: true,
  })
);

// ------------------- SWAGGER -------------------
const swaggerUrl =
  "https://raw.githubusercontent.com/ItsMeYash25/Forza-Customs-API/refs/heads/main/forza-customs-api-doc.yaml";

let swaggerDocument = null;

async function getSwaggerDoc() {
  if (!swaggerDocument) {
    try {
      const res = await fetch(swaggerUrl);
      const text = await res.text();
      swaggerDocument = YAML.parse(text);
    } catch (error) {
      console.error("❌ Failed to load Swagger YAML:", error);
      swaggerDocument = { openapi: "3.0.0", info: { title: "Error Loading Docs" } };
    }
  }
  return swaggerDocument;
}

// Lazy load swagger on request
app.use("/api-docs", async (req, res, next) => {
  const doc = await getSwaggerDoc();
  swaggerUi.setup(doc)(req, res, next);
}, swaggerUi.serve);

// ------------------- ROUTES -------------------
app.use("/api/users", userRoutes);
app.use("/api/parts", partRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/bill", billRoutes);
app.use("/api/service", serviceRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/categories", categoryRoutes);

app.get("/", (req, res) => {
  res.send("🚗 Forza Customs API running successfully!");
});

// ------------------- ERROR HANDLING -------------------
app.use(notFound);
app.use(errorHandler);

// ------------------- START SERVER -------------------
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});

export default app;