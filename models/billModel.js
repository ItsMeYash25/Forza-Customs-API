import mongoose from "mongoose";

const billSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  contact: { type: String, required: true },
  addr: { type: String, required: true },
  cart: [
    {
      id: { type: mongoose.Schema.Types.ObjectId },
      name: { type: String },
      price: { type: Number },
      qty: { type: Number },
      total: { type: Number },
    },
  ],
  totalCost: { type: Number },
  status: { type: String, required: true, default: "pending" },
});

const Bill = mongoose.model("Bill", billSchema);

export default Bill;
