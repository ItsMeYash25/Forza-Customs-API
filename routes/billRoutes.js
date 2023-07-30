import express from "express";
import {
  generate,
  billsList,
  changeStatus,
} from "../controllers/billsController.js";
const router = express.Router();

router.get("/", billsList);
router.post("/generate", generate);
router.put("/shipped/:id", changeStatus);

export default router;
