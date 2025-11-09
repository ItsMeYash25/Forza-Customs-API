import cron from "node-cron";
import Session from "../models/sessionModel.js";

// Runs every night at 2 AM
cron.schedule("0 2 * * *", async () => {
    console.log("🧹 Cleaning old/inactive sessions...");
    await Session.deleteMany({
        user: user._id,
        $or: [
            { isActive: false },
            { lastActiveAt: { $lt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000) } },
        ],
    });
    console.log("✅ Session cleanup complete.");
});