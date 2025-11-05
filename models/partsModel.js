import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  public_id: String,
  url: String,
});

const partSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    discount: { type: Number, default: 0 }, // percent
    poster: imageSchema,
    gallery: [imageSchema],
    tags: [String],
  },
  { timestamps: true }
);

export default mongoose.model("Part", partSchema);
