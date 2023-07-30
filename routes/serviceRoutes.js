import {
  addAppointment,
  updateStatusAppointment,
  viewAppointments,
  viewStatus,
} from "../controllers/serviceController.js";
import express from "express";

const router = express.Router();

router.get("/", viewAppointments);
router.post("/add", addAppointment);
router.post("/check", viewStatus);
router.put("/update",updateStatusAppointment);

export default router;
