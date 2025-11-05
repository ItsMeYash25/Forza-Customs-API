import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter category name"],
            unique: true,
            trim: true,
        },
        icon: { type: String },
        description: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
