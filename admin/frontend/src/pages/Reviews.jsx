import { useState, useEffect } from "react";
import { getReviews, deleteReview, hideReview, showReview, approveReview, rejectReview } from "../api";
import { toast } from "react-toastify";
import LoadingSkeleton from "../components/LoadingSkeleton";
import {
    HiOutlineStar, HiOutlineTrash, HiOutlineEye, HiOutlineEyeOff,
    HiOutlineCheck, HiOutlineX, HiOutlineSearch, HiOutlineChatAlt,
    HiOutlineFilter
} from "react-icons/hi";

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState("");
    const [ratingFilter, setRatingFilter] = useState("");
    const [search, setSearch] = useState("");
    const limit = 15;

    useEffect(() => {
        fetchReviews();
    }, [page, filter, ratingFilter]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const params = { page, limit, sort: "-createdAt" };
            if (filter) params.filter = filter;
            if (ratingFilter) params.rating = ratingFilter;
            if (search) params.search = search;
            const { data } = await getReviews(params);
            setReviews(data?.reviews || []);
            setTotal(data?.total || 0);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch reviews");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchReviews();
    };

    const handleApprove = async (id) => {
        try {
            await approveReview(id);
            toast.success("Review approved and published");
            fetchReviews();
        } catch (error) {
            toast.error("Failed to approve review");
        }
    };

    const handleReject = async (id) => {
        try {
            await rejectReview(id);
            toast.info("Review marked as unapproved");
            fetchReviews();
        } catch (error) {
            toast.error("Failed to reject review");
        }
    };

    const handleToggleVisibility = async (r) => {
        try {
            if (r.isHidden) {
                await showReview(r._id);
                toast.success("Review is now visible to customers");
            } else {
                await hideReview(r._id);
                toast.info("Review hidden from public storefront");
            }
            fetchReviews();
        } catch (error) {
            toast.error("Failed to update visibility");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanently delete this review?")) return;
        try {
            await deleteReview(id);
            toast.success("Review deleted permanently");
            fetchReviews();
        } catch (error) {
            toast.error("Failed to delete review");
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Reviews & Ratings</h1>
                    <p className="text-sm text-gray-500">{total} reviews submitted by food delivery customers</p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 items-center justify-between">
                <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[220px]">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search review comments..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                    />
                </form>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={filter}
                        onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
                    >
                        <option value="">All Review Statuses</option>
                        <option value="pending">Pending Moderation</option>
                        <option value="approved">Approved Reviews</option>
                        <option value="visible">Visible on Store</option>
                        <option value="hidden">Hidden from Store</option>
                    </select>

                    <select
                        value={ratingFilter}
                        onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
                    >
                        <option value="">All Ratings</option>
                        <option value="5">5 Stars ⭐⭐⭐⭐⭐</option>
                        <option value="4">4 Stars ⭐⭐⭐⭐</option>
                        <option value="3">3 Stars ⭐⭐⭐</option>
                        <option value="2">2 Stars ⭐⭐</option>
                        <option value="1">1 Star ⭐</option>
                    </select>
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {loading ? (
                    <LoadingSkeleton count={5} />
                ) : reviews.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
                        <HiOutlineChatAlt className="w-14 h-14 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">No Reviews Found</h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                            {search || filter || ratingFilter
                                ? "No reviews match your selected filters."
                                : "No reviews have been submitted by customers yet."}
                        </p>
                    </div>
                ) : (
                    reviews.map((r) => (
                        <div
                            key={r._id}
                            className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm">
                                        {r.user?.fullName ? r.user.fullName.charAt(0).toUpperCase() : "U"}
                                    </div>
                                    <div className="space-y-1.5 flex-1">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <p className="font-bold text-gray-900 dark:text-white text-base">
                                                {r.user?.fullName || "Anonymous User"}
                                            </p>
                                            <div className="flex items-center text-amber-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <HiOutlineStar
                                                        key={i}
                                                        className={`w-4 h-4 ${i < (r.rating || 0) ? "fill-current text-amber-400" : "text-gray-300 dark:text-gray-600"}`}
                                                    />
                                                ))}
                                                <span className="ml-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                                                    {r.rating}.0
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", {
                                                    day: "numeric", month: "short", year: "numeric"
                                                }) : ""}
                                            </span>
                                        </div>

                                        {/* Target context (Food or Restaurant) */}
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                                            {r.item?.name && (
                                                <span className="bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-md font-medium border border-orange-200 dark:border-orange-800">
                                                    Dish: {r.item.name}
                                                </span>
                                            )}
                                            {r.shop?.name && (
                                                <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-medium border border-blue-200 dark:border-blue-800">
                                                    Restaurant: {r.shop.name}
                                                </span>
                                            )}
                                        </div>

                                        {/* Comment */}
                                        {r.comment ? (
                                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-1">
                                                "{r.comment}"
                                            </p>
                                        ) : (
                                            <p className="text-xs italic text-gray-400 pt-1">No written feedback provided.</p>
                                        )}

                                        {/* Status badges */}
                                        <div className="flex items-center gap-2 pt-2">
                                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                                r.isApproved
                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200"
                                                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200"
                                            }`}>
                                                {r.isApproved ? "Approved" : "Pending Moderation"}
                                            </span>
                                            {r.isHidden && (
                                                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200">
                                                    Hidden from Storefront
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex sm:flex-col items-center gap-1.5 self-end sm:self-center shrink-0">
                                    {!r.isApproved ? (
                                        <button
                                            onClick={() => handleApprove(r._id)}
                                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors"
                                            title="Approve review"
                                        >
                                            <HiOutlineCheck className="w-3.5 h-3.5" /> Approve
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleReject(r._id)}
                                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200 flex items-center gap-1 transition-colors"
                                            title="Un-approve review"
                                        >
                                            <HiOutlineX className="w-3.5 h-3.5" /> Disapprove
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleToggleVisibility(r)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1 transition-colors w-full justify-center ${
                                            r.isHidden
                                                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300"
                                        }`}
                                        title={r.isHidden ? "Make visible" : "Hide review"}
                                    >
                                        {r.isHidden ? (
                                            <><HiOutlineEye className="w-3.5 h-3.5" /> Unhide</>
                                        ) : (
                                            <><HiOutlineEyeOff className="w-3.5 h-3.5" /> Hide</>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => handleDelete(r._id)}
                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 rounded-lg transition-colors"
                                        title="Delete review permanently"
                                    >
                                        <HiOutlineTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                        className="px-3.5 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1.5 text-xs text-gray-500">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                        className="px-3.5 py-1.5 text-xs font-semibold border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default Reviews;

