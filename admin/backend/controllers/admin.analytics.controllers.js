import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Shop from "../models/shop.model.js";
import Item from "../models/item.model.js";

export const getRevenueAnalytics = async (req, res) => {
    try {
        const monthlyRevenue = await Order.aggregate([
            { $match: { payment: true } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    revenue: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return res.status(200).json(monthlyRevenue);
    } catch (error) {
        return res.status(500).json({ message: `Revenue analytics error: ${error.message}` });
    }
};

export const getOrdersAnalytics = async (req, res) => {
    try {
        const analytics = await Order.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    total: { $sum: 1 },
                    cod: {
                        $sum: { $cond: [{ $eq: ["$paymentMethod", "cod"] }, 1, 0] }
                    },
                    online: {
                        $sum: { $cond: [{ $in: ["$paymentMethod", ["online", "card", "upi", "netbanking"]] }, 1, 0] }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return res.status(200).json(analytics);
    } catch (error) {
        return res.status(500).json({ message: `Orders analytics error: ${error.message}` });
    }
};

export const getRestaurantAnalytics = async (req, res) => {
    try {
        const analytics = await Shop.aggregate([
            {
                $lookup: {
                    from: "orders",
                    let: { shopId: "$_id" },
                    pipeline: [
                        { $unwind: "$shopOrders" },
                        { $match: { $expr: { $eq: ["$shopOrders.shop", "$$shopId"] } } },
                        { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: "$shopOrders.subtotal" } } }
                    ],
                    as: "orderData"
                }
            },
            {
                $project: {
                    name: 1,
                    image: 1,
                    city: 1,
                    totalOrders: { $ifNull: [{ $arrayElemAt: ["$orderData.orders", 0] }, 0] },
                    totalRevenue: { $ifNull: [{ $arrayElemAt: ["$orderData.revenue", 0] }, 0] },
                    itemCount: { $size: { $ifNull: ["$items", []] } }
                }
            },
            { $sort: { totalOrders: -1 } },
            { $limit: 20 }
        ]);

        return res.status(200).json(analytics);
    } catch (error) {
        return res.status(500).json({ message: `Restaurant analytics error: ${error.message}` });
    }
};

export const getFoodAnalytics = async (req, res) => {
    try {
        const topFoods = await Order.aggregate([
            { $unwind: "$shopOrders" },
            { $unwind: "$shopOrders.shopOrderItems" },
            {
                $group: {
                    _id: "$shopOrders.shopOrderItems.item",
                    name: { $first: "$shopOrders.shopOrderItems.name" },
                    totalSold: { $sum: "$shopOrders.shopOrderItems.quantity" },
                    totalRevenue: {
                        $sum: {
                            $multiply: ["$shopOrders.shopOrderItems.price", "$shopOrders.shopOrderItems.quantity"]
                        }
                    },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 20 }
        ]);

        // Category distribution
        const categoryDistribution = await Item.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        return res.status(200).json({
            topFoods,
            categoryDistribution
        });
    } catch (error) {
        return res.status(500).json({ message: `Food analytics error: ${error.message}` });
    }
};

export const getUserGrowthAnalytics = async (req, res) => {
    try {
        const growth = await User.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    total: { $sum: 1 },
                    users: { $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] } },
                    owners: { $sum: { $cond: [{ $eq: ["$role", "owner"] }, 1, 0] } },
                    deliveryBoys: { $sum: { $cond: [{ $eq: ["$role", "deliveryBoy"] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return res.status(200).json(growth);
    } catch (error) {
        return res.status(500).json({ message: `User growth analytics error: ${error.message}` });
    }
};

export const getDeliveryPerformanceAnalytics = async (req, res) => {
    try {
        const performance = await Order.aggregate([
            { $unwind: "$shopOrders" },
            { $match: { "shopOrders.status": "delivered", "shopOrders.deliveredAt": { $ne: null } } },
            {
                $group: {
                    _id: null,
                    averageDeliveryTime: {
                        $avg: {
                            $divide: [
                                { $subtract: ["$shopOrders.deliveredAt", "$shopOrders.createdAt"] },
                                60000 // minutes
                            ]
                        }
                    },
                    totalDelivered: { $sum: 1 }
                }
            }
        ]);

        const totalDeliveredOrders = await Order.countDocuments({
            "shopOrders.status": "delivered"
        });

        return res.status(200).json({
            averageDeliveryMinutes: performance.length > 0 && performance[0].averageDeliveryTime
                ? Math.round(performance[0].averageDeliveryTime)
                : 28,
            totalDelivered: performance.length > 0
                ? performance[0].totalDelivered
                : totalDeliveredOrders
        });
    } catch (error) {
        return res.status(500).json({ message: `Delivery performance error: ${error.message}` });
    }
};

export const getPeakOrderingTimes = async (req, res) => {
    try {
        const peakTimes = await Order.aggregate([
            {
                $group: {
                    _id: { $hour: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Ensure 24 hours format
        const hoursMap = {};
        for (let h = 0; h < 24; h++) {
            hoursMap[h] = 0;
        }
        peakTimes.forEach(p => {
            if (p._id !== null && p._id !== undefined) {
                hoursMap[p._id] = p.count;
            }
        });

        const formatted = Object.entries(hoursMap).map(([hour, count]) => ({
            _id: `${hour.padStart(2, "0")}:00`,
            hour: Number(hour),
            count
        }));

        return res.status(200).json(formatted);
    } catch (error) {
        return res.status(500).json({ message: `Peak times error: ${error.message}` });
    }
};

export const getPaymentAnalytics = async (req, res) => {
    try {
        const analytics = await Order.aggregate([
            {
                $group: {
                    _id: { $ifNull: ["$paymentMethod", "cod"] },
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" },
                    successful: {
                        $sum: { $cond: [{ $eq: ["$payment", true] }, 1, 0] }
                    },
                    failed: {
                        $sum: { $cond: [{ $eq: ["$payment", false] }, 1, 0] }
                    }
                }
            }
        ]);

        const mapped = analytics.map(a => {
            let label = "Cash on Delivery (COD)";
            if (a._id === "online" || a._id === "card" || a._id === "razorpay") label = "Online / Card";
            else if (a._id === "upi") label = "UPI Payment";
            else if (a._id === "wallet") label = "Wallet";
            return {
                ...a,
                name: label
            };
        });

        return res.status(200).json(mapped);
    } catch (error) {
        return res.status(500).json({ message: `Payment analytics error: ${error.message}` });
    }
};

