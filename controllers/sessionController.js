import Session from "../models/sessionModel.js";
import asyncHandler from "express-async-handler";

// @desc    Get all active sessions for the logged-in user
// @route   GET /api/users/sessions
// @access  Private
const viewSessions = asyncHandler(async (req, res) => {
    const sessions = await Session.find({ user: req.user._id, isActive: true })
        .select("-token")
        .sort({ lastActiveAt: -1 });
    res.json(sessions);
});

// @desc    Logout from a specific session
// @route   DELETE /api/users/sessions/:sessionId
// @access  Private
const logoutSession = asyncHandler(async (req, res) => {
    const session = await Session.findOne({ _id: req.params.sessionId, user: req.user._id });
    if (!session) {
        res.status(404);
        throw new Error("Session not found");
    }
    session.isActive = false;
    await session.save();
    res.json({ message: "Session logged out successfully" });
});

// @desc    Logout from all devices
// @route   DELETE /api/users/sessions
// @access  Private
const logoutAllSessions = asyncHandler(async (req, res) => {
    await Session.updateMany({ user: req.user._id }, { isActive: false });
    res.json({ message: "All sessions logged out successfully" });
});

export { viewSessions, logoutSession, logoutAllSessions };
