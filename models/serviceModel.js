import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    contactNumber: { type: String, required: true },
    address: { type: String, required: true },
    vehicleName: { type: String, required: true },
    vehicleNumber: { type: String, required: true },
    appointmentDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Unseen", "Confirmed", "In Progress", "Completed", "Cancelled"],
      default: "Unseen",
    },
    message: {
      type: String,
      default: "Your appointment is not yet reviewed.",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Service", serviceSchema);
