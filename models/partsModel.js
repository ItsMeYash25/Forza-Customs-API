import mongoose from "mongoose";
const partSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add the name of part"],
    },
    price: {
      type: Number,
      required: [true, "Please add the price of part"],
    },
    imageURL: {
      type: String,
      required: [true, "Please add the image of part"],
    },
  },
  {
    timestamps: true,
  }
);

const Part = mongoose.model("Part", partSchema);

export default Part;
