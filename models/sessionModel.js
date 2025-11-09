import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    ipAddress: String,
    userAgent: String,
    device: String,
    os: String,
    location: {
        city: String,
        region: String,
        country: String,
    },
    token: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastActiveAt: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Session = mongoose.model("Session", sessionSchema);
export default Session;
