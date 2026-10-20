import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

export const getAllNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, type = "", search = "" } = req.query;
        const query = {};
        if (type) query.type = type;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { message: { $regex: search, $options: "i" } }
            ];
        }

        const total = await Notification.countDocuments(query);
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .populate("sentBy", "fullName email")
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .lean();

        // Ensure recipientType is always present for frontend safety
        const formatted = notifications.map(n => ({
            ...n,
            recipientType: n.recipientType || n.targetRole || "all_users"
        }));

        return res.status(200).json({
            notifications: formatted,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        return res.status(500).json({ message: `Get notifications error: ${error.message}` });
    }
};

export const getNotificationById = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.notificationId)
            .populate("sentBy", "fullName email")
            .populate("recipients", "fullName email")
            .lean();
        if (!notification) return res.status(404).json({ message: "Notification not found" });
        return res.status(200).json({
            ...notification,
            recipientType: notification.recipientType || notification.targetRole || "all_users"
        });
    } catch (error) {
        return res.status(500).json({ message: `Get notification error: ${error.message}` });
    }
};

export const sendNotification = async (req, res) => {
    try {
        const { title, message, type, recipientType, recipientIds } = req.body;

        if (!title || !message) {
            return res.status(400).json({ message: "Title and message are required" });
        }

        let recipients = [];
        const actualRecipientType = recipientType || "all_users";

        if (actualRecipientType === "all_users") {
            const users = await User.find({ role: "user" }).select("_id");
            recipients = users.map(u => u._id);
        } else if (actualRecipientType === "all_owners") {
            const owners = await User.find({ role: "owner" }).select("_id");
            recipients = owners.map(u => u._id);
        } else if (actualRecipientType === "all_delivery_boys") {
            const boys = await User.find({ role: "deliveryBoy" }).select("_id");
            recipients = boys.map(u => u._id);
        } else if ((actualRecipientType === "specific_users" || actualRecipientType === "specific_restaurants") && recipientIds) {
            recipients = Array.isArray(recipientIds) ? recipientIds : [recipientIds];
        }

        const notification = await Notification.create({
            title,
            message,
            type: type || "push",
            recipientType: actualRecipientType,
            targetRole: actualRecipientType.replace("all_", ""),
            recipients,
            sentBy: req.adminId || null,
            isSent: true,
            sentAt: new Date()
        });

        // Broadcast through Socket.io if available on app
        const io = req.app.get("io");
        if (io) {
            io.emit("adminNotification", {
                title,
                message,
                type: type || "push",
                notificationId: notification._id
            });
        }

        return res.status(201).json({ message: "Notification sent successfully", notification });
    } catch (error) {
        return res.status(500).json({ message: `Send notification error: ${error.message}` });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.notificationId);
        if (!notification) return res.status(404).json({ message: "Notification not found" });
        return res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: `Delete notification error: ${error.message}` });
    }
};

