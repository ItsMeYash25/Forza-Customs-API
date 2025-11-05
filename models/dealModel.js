import mongoose from "mongoose";

const dealSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        discountPercentage: { type: Number, required: true },
        products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Part" }],
        bannerImage: { public_id: String, url: String },
        validTill: { type: Date },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model("Deal", dealSchema);
