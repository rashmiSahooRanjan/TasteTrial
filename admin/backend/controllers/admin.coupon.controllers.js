import Coupon from "../models/coupon.model.js";

export const getAllCoupons = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = "", sort = "-createdAt", filter = "", status = "" } = req.query;
        const query = {};

        const activeFilter = filter || status;
        if (activeFilter === "active") query.isActive = true;
        else if (activeFilter === "disabled" || activeFilter === "inactive") query.isActive = false;
        else if (activeFilter === "expired") query.expiryDate = { $lt: new Date() };

        if (search) {
            query.code = { $regex: search, $options: "i" };
        }

        const total = await Coupon.countDocuments(query);
        const rawCoupons = await Coupon.find(query)
            .sort(sort)
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .lean();

        // Normalize discount percentage for frontend
        const coupons = rawCoupons.map(c => ({
            ...c,
            discountPercentage: c.discountPercentage ?? c.discountValue ?? 0
        }));

        return res.status(200).json({
            coupons,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        return res.status(500).json({ message: `Get coupons error: ${error.message}` });
    }
};

export const getCouponById = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.couponId).lean();
        if (!coupon) return res.status(404).json({ message: "Coupon not found" });
        return res.status(200).json({
            ...coupon,
            discountPercentage: coupon.discountPercentage ?? coupon.discountValue ?? 0
        });
    } catch (error) {
        return res.status(500).json({ message: `Get coupon error: ${error.message}` });
    }
};

export const createCoupon = async (req, res) => {
    try {
        const {
            code, description, discountPercentage, discountValue, discountType,
            minOrderAmount, maxDiscount, usageLimit, expiryDate
        } = req.body;

        if (!code) {
            return res.status(400).json({ message: "Coupon code is required" });
        }

        const discount = discountPercentage !== undefined && discountPercentage !== ""
            ? Number(discountPercentage)
            : Number(discountValue || 0);

        if (!discount || discount <= 0) {
            return res.status(400).json({ message: "Valid discount percentage is required" });
        }

        if (!expiryDate) {
            return res.status(400).json({ message: "Expiry date is required" });
        }

        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(400).json({ message: "Coupon code already exists" });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            description: description || "",
            discountPercentage: discount,
            discountValue: discount,
            discountType: discountType || "percentage",
            minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
            maxDiscount: maxDiscount ? Number(maxDiscount) : 0,
            usageLimit: usageLimit ? Number(usageLimit) : 100,
            expiryDate: new Date(expiryDate),
            createdBy: req.adminId || null
        });

        return res.status(201).json(coupon);
    } catch (error) {
        return res.status(500).json({ message: `Create coupon error: ${error.message}` });
    }
};

export const updateCoupon = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (updateData.code) updateData.code = updateData.code.toUpperCase();

        if (updateData.discountPercentage !== undefined && updateData.discountPercentage !== "") {
            updateData.discountPercentage = Number(updateData.discountPercentage);
            updateData.discountValue = updateData.discountPercentage;
        } else if (updateData.discountValue !== undefined && updateData.discountValue !== "") {
            updateData.discountValue = Number(updateData.discountValue);
            updateData.discountPercentage = updateData.discountValue;
        }

        if (updateData.minOrderAmount !== undefined) updateData.minOrderAmount = Number(updateData.minOrderAmount);
        if (updateData.maxDiscount !== undefined) updateData.maxDiscount = Number(updateData.maxDiscount);
        if (updateData.usageLimit !== undefined) updateData.usageLimit = Number(updateData.usageLimit);
        if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);

        const coupon = await Coupon.findByIdAndUpdate(req.params.couponId, updateData, { new: true });
        if (!coupon) return res.status(404).json({ message: "Coupon not found" });
        return res.status(200).json(coupon);
    } catch (error) {
        return res.status(500).json({ message: `Update coupon error: ${error.message}` });
    }
};

export const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.couponId);
        if (!coupon) return res.status(404).json({ message: "Coupon not found" });
        return res.status(200).json({ message: "Coupon deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: `Delete coupon error: ${error.message}` });
    }
};

export const toggleCouponStatus = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.couponId);
        if (!coupon) return res.status(404).json({ message: "Coupon not found" });
        coupon.isActive = !coupon.isActive;
        await coupon.save();
        return res.status(200).json({ message: `Coupon ${coupon.isActive ? "activated" : "deactivated"}`, coupon });
    } catch (error) {
        return res.status(500).json({ message: `Toggle coupon status error: ${error.message}` });
    }
};

