import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  part: { type: mongoose.Schema.Types.ObjectId, ref: "Part" },
  name: String,
  price: Number,
  qty: Number,
  total: Number,
});

const billSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    contact: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
    },
    cart: [cartItemSchema],
    totalCost: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      default: "cod",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Bill", billSchema);
