import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["push", "email", "sms", "info", "warning", "promotion", "order", "system"],
        default: "push"
    },
    recipientType: {
        type: String,
        enum: ["all_users", "all_owners", "all_delivery_boys", "specific_users", "specific_restaurants", "all"],
        default: "all_users"
    },
    recipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    targetRole: {
        type: String,
        default: "all"
    },
    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    },
    isSent: {
        type: Boolean,
        default: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;

