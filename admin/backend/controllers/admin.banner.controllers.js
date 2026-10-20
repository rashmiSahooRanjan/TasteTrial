import Banner from "../models/banner.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

export const getAllBanners = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const status = req.query.status || req.query.filter || "";
        const type = req.query.type || "";
        const search = req.query.search || "";

        const query = {};
        if (status === "active" || status === "true") query.isActive = true;
        if (status === "inactive" || status === "false") query.isActive = false;
        if (type) query.type = type;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { subtitle: { $regex: search, $options: "i" } }
            ];
        }

        const total = await Banner.countDocuments(query);
        const banners = await Banner.find(query)
            .sort({ order: 1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return res.status(200).json({ banners, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        return res.status(500).json({ message: `Get banners error: ${error.message}` });
    }
};

export const getBannerById = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.bannerId);
        if (!banner) return res.status(404).json({ message: "Banner not found" });
        return res.status(200).json(banner);
    } catch (error) {
        return res.status(500).json({ message: `Get banner error: ${error.message}` });
    }
};

export const createBanner = async (req, res) => {
    try {
        const { title, subtitle, description, link, type, order, isActive } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Banner title is required" });
        }

        let image = "";
        if (req.file) {
            image = await uploadOnCloudinary(req.file.path);
        } else if (req.body.image) {
            image = req.body.image;
        }

        if (!image) {
            return res.status(400).json({ message: "Banner image is required" });
        }

        const banner = await Banner.create({
            title,
            subtitle: subtitle || "",
            description: description || "",
            link: link || "",
            image,
            type: type || "home",
            order: order !== undefined ? Number(order) : 0,
            isActive: isActive === undefined ? true : (isActive === true || isActive === "true"),
            createdBy: req.adminId || null
        });

        return res.status(201).json(banner);
    } catch (error) {
        return res.status(500).json({ message: `Create banner error: ${error.message}` });
    }
};

export const updateBanner = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.file) {
            updateData.image = await uploadOnCloudinary(req.file.path);
        }
        if (updateData.order !== undefined) {
            updateData.order = Number(updateData.order);
        }
        if (updateData.isActive !== undefined) {
            updateData.isActive = updateData.isActive === true || updateData.isActive === "true";
        }

        const banner = await Banner.findByIdAndUpdate(req.params.bannerId, updateData, { new: true });
        if (!banner) return res.status(404).json({ message: "Banner not found" });
        return res.status(200).json(banner);
    } catch (error) {
        return res.status(500).json({ message: `Update banner error: ${error.message}` });
    }
};

export const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndDelete(req.params.bannerId);
        if (!banner) return res.status(404).json({ message: "Banner not found" });
        return res.status(200).json({ message: "Banner deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: `Delete banner error: ${error.message}` });
    }
};

export const toggleBannerStatus = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.bannerId);
        if (!banner) return res.status(404).json({ message: "Banner not found" });
        banner.isActive = !banner.isActive;
        await banner.save();
        return res.status(200).json({ message: `Banner ${banner.isActive ? "activated" : "deactivated"}`, banner });
    } catch (error) {
        return res.status(500).json({ message: `Toggle banner status error: ${error.message}` });
    }
};

