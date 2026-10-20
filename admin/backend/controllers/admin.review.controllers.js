import Review from "../models/review.model.js";

export const getAllReviews = async (req, res) => {
    try {
        const { page = 1, limit = 20, sort = "-createdAt", filter = "", status = "", rating = "", search = "" } = req.query;
        const query = {};

        const activeFilter = filter || status;
        if (activeFilter === "approved") query.isApproved = true;
        else if (activeFilter === "pending") query.isApproved = false;
        else if (activeFilter === "hidden") query.isHidden = true;
        else if (activeFilter === "visible") query.isHidden = false;

        if (rating) query.rating = parseInt(rating);
        if (search) {
            query.comment = { $regex: search, $options: "i" };
        }

        const total = await Review.countDocuments(query);
        const reviews = await Review.find(query)
            .sort(sort)
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .populate("user", "fullName email")
            .populate("shop", "name image")
            .populate("item", "name image price")
            .lean();

        return res.status(200).json({
            reviews,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        return res.status(500).json({ message: `Get reviews error: ${error.message}` });
    }
};

export const getReviewById = async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId)
            .populate("user", "fullName email")
            .populate("shop", "name")
            .populate("item", "name");
        if (!review) return res.status(404).json({ message: "Review not found" });
        return res.status(200).json(review);
    } catch (error) {
        return res.status(500).json({ message: `Get review error: ${error.message}` });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.reviewId);
        if (!review) return res.status(404).json({ message: "Review not found" });
        return res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: `Delete review error: ${error.message}` });
    }
};

export const hideReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.reviewId,
            { isHidden: true },
            { new: true }
        );
        if (!review) return res.status(404).json({ message: "Review not found" });
        return res.status(200).json({ message: "Review hidden", review });
    } catch (error) {
        return res.status(500).json({ message: `Hide review error: ${error.message}` });
    }
};

export const showReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.reviewId,
            { isHidden: false },
            { new: true }
        );
        if (!review) return res.status(404).json({ message: "Review not found" });
        return res.status(200).json({ message: "Review visible", review });
    } catch (error) {
        return res.status(500).json({ message: `Show review error: ${error.message}` });
    }
};

export const approveReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.reviewId,
            { isApproved: true },
            { new: true }
        );
        if (!review) return res.status(404).json({ message: "Review not found" });
        return res.status(200).json({ message: "Review approved", review });
    } catch (error) {
        return res.status(500).json({ message: `Approve review error: ${error.message}` });
    }
};

export const rejectReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.reviewId,
            { isApproved: false },
            { new: true }
        );
        if (!review) return res.status(404).json({ message: "Review not found" });
        return res.status(200).json({ message: "Review rejected", review });
    } catch (error) {
        return res.status(500).json({ message: `Reject review error: ${error.message}` });
    }
};

