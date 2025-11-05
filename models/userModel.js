import mongoose from "mongoose";
import bcrypt from "bcrypt";

const addressSchema = new mongoose.Schema({
  label: { type: String, default: "Home" },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const USER_ROLES = ["user", "admin", "warehouse_admin", "service_admin"];

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
    },

    password: { type: String, required: true, minlength: 6 },

    contact: { type: String },

    addresses: [addressSchema],

    role: {
      type: String,
      enum: USER_ROLES,
      default: "user", // default to normal customer
    },

    isVerified: { type: Boolean, default: false },

    avatar: {
      public_id: { type: String },
      url: { type: String },
    },

    razorpayCustomerId: { type: String },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.hasRole = function (role) {
  return this.role === role;
};

export default mongoose.model("User", userSchema);
