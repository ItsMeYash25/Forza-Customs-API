import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
    part: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Part",
        required: true,
    },
    name: String,
    price: Number,
    qty: { type: Number, default: 1 },
    total: Number,
});

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        cart: [cartItemSchema],
        totalCost: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export default mongoose.model("Cart", cartSchema);