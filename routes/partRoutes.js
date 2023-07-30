import express from "express";
const router = express.Router();
import {
  addParts,
  viewAllParts,
  viewPartsById,
  updateParts,
  deleteParts,
} from "../controllers/partsController.js";
import singleUpload from "../middleware/multer.js";
const app = express();

router.get("/", viewAllParts);
router.get("/:id", viewPartsById);
router.post("/add", singleUpload, addParts);
router.put("/update/:id", updateParts);
router.delete("/delete/:id", deleteParts);

export default router;
