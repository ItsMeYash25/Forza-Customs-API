// models/Banner.js
import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        subtitle: { type: String },
        image: {
            public_id: String,
            url: String,
        },
        ctaText: { type: String, default: "Shop Now" },
        ctaLink: { type: String, default: "/shop" },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model("Banner", bannerSchema);
