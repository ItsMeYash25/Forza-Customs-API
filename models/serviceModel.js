import mongoose from "mongoose";

const serviceSchema = mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  contact_number: { type: Number, required: true },
  address: { type: String, required: true },
  vehicle_name: { type: String, required: true },
  vehicle_number: { type: String, required: true },
  appointment_date: { type: String, required: true },
  status: { type: String, default: "Unseen" },
  message: { type: String, default: "Your appointment is not yet reviewed." },
});

const Service = mongoose.model("Service", serviceSchema);

export default Service;
