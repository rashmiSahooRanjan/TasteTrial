import { useState, useEffect } from "react";
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, toggleCouponStatus } from "../api";
import { toast } from "react-toastify";
import LoadingSkeleton from "../components/LoadingSkeleton";
import {
    HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX,
    HiOutlineSearch, HiOutlineTicket, HiOutlineClipboardCopy
} from "react-icons/hi";

const Coupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        code: "",
        discountPercentage: "",
        maxDiscount: "",
        minOrderAmount: "",
        expiryDate: "",
        usageLimit: "100"
    });
    const limit = 15;

    useEffect(() => {
        fetchCoupons();
    }, [page, filter]);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const params = { page, limit, sort: "-createdAt" };
            if (filter) params.filter = filter;
            if (search) params.search = search;
            const { data } = await getCoupons(params);
            setCoupons(data?.coupons || []);
            setTotal(data?.total || 0);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch coupons");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchCoupons();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editId) {
                await updateCoupon(editId, formData);
                toast.success("Coupon updated successfully");
            } else {
                await createCoupon(formData);
                toast.success("Coupon created successfully");
            }
            setShowModal(false);
            resetForm();
            fetchCoupons();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            await toggleCouponStatus(id);
            toast.success("Coupon status toggled");
            fetchCoupons();
        } catch (error) {
            toast.error("Failed to toggle coupon status");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this coupon?")) return;
        try {
            await deleteCoupon(id);
            toast.success("Coupon deleted successfully");
            fetchCoupons();
        } catch (error) {
            toast.error("Failed to delete coupon");
        }
    };

    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code);
        toast.info(`Copied "${code}" to clipboard!`);
    };

    const resetForm = () => {
        setFormData({
            code: "",
            discountPercentage: "",
            maxDiscount: "",
            minOrderAmount: "",
            expiryDate: "",
            usageLimit: "100"
        });
        setEditId(null);
    };

    const openEdit = (c) => {
        setEditId(c._id);
        setFormData({
            code: c.code || "",
            discountPercentage: (c.discountPercentage ?? c.discountValue ?? "").toString(),
            maxDiscount: (c.maxDiscount ?? "").toString(),
            minOrderAmount: (c.minOrderAmount ?? "").toString(),
            expiryDate: c.expiryDate ? c.expiryDate.split("T")[0] : "",
            usageLimit: (c.usageLimit ?? 100).toString()
        });
        setShowModal(true);
    };

    const totalPages = Math.ceil(total / limit);

    const isExpired = (expiryDate) => {
        if (!expiryDate) return false;
        return new Date(expiryDate) < new Date();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discount Coupons</h1>
                    <p className="text-sm text-gray-500">{total} active and promotional vouchers</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95"
                >
                    <HiOutlinePlus className="w-5 h-5" /> Add New Coupon
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 items-center justify-between">
                <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[220px]">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search coupons by code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                    />
                </form>

                <div className="flex items-center gap-2">
                    <select
                        value={filter}
                        onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
                    >
                        <option value="">All Coupons</option>
                        <option value="active">Active Only</option>
                        <option value="disabled">Disabled Only</option>
                        <option value="expired">Expired Only</option>
                    </select>
                </div>
            </div>

            {/* Coupons Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-5 py-3.5">Coupon Code</th>
                                <th className="px-5 py-3.5">Discount Rate</th>
                                <th className="px-5 py-3.5 hidden sm:table-cell">Min. Order</th>
                                <th className="px-5 py-3.5 hidden md:table-cell">Max. Cap</th>
                                <th className="px-5 py-3.5 hidden lg:table-cell">Expiry Date</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-4">
                                        <LoadingSkeleton type="table" count={5} />
                                    </td>
                                </tr>
                            ) : coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-16 text-gray-400">
                                        <HiOutlineTicket className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                                        <p className="font-medium text-gray-600 dark:text-gray-300">No coupons found</p>
                                        <p className="text-xs text-gray-400 mt-1">Create coupons to give your customers exciting discounts</p>
                                    </td>
                                </tr>
                            ) : (
                                coupons.map((c) => {
                                    const expired = isExpired(c.expiryDate);
                                    return (
                                        <tr key={c._id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-lg border border-orange-200 dark:border-orange-800 text-sm">
                                                        {c.code}
                                                    </span>
                                                    <button
                                                        onClick={() => copyToClipboard(c.code)}
                                                        className="text-gray-400 hover:text-orange-500 transition-colors p-1"
                                                        title="Copy code"
                                                    >
                                                        <HiOutlineClipboardCopy className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                                {c.discountPercentage || c.discountValue || 0}% Off
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                                                ₹{c.minOrderAmount || 0}
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">
                                                {c.maxDiscount ? `₹${c.maxDiscount}` : "No Limit"}
                                            </td>
                                            <td className="px-5 py-4 text-xs text-gray-500 hidden lg:table-cell">
                                                {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("en-IN", {
                                                    day: "numeric", month: "short", year: "numeric"
                                                }) : "N/A"}
                                            </td>
                                            <td className="px-5 py-4">
                                                {expired ? (
                                                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                                        Expired
                                                    </span>
                                                ) : c.isActive ? (
                                                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800">
                                                        Disabled
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openEdit(c)}
                                                        className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg text-emerald-600 transition-colors"
                                                        title="Edit coupon"
                                                    >
                                                        <HiOutlinePencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggle(c._id)}
                                                        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                                                            c.isActive
                                                                ? "border-amber-200 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                                        }`}
                                                    >
                                                        {c.isActive ? "Disable" : "Enable"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(c._id)}
                                                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-red-600 transition-colors"
                                                        title="Delete coupon"
                                                    >
                                                        <HiOutlineTrash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 my-8" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editId ? "Edit Coupon" : "Create New Coupon"}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                            >
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Coupon Code *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. TASTY50"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm font-mono font-bold tracking-wider focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Discount % *</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 20"
                                        value={formData.discountPercentage}
                                        onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white"
                                        required
                                        min={1}
                                        max={100}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Max Cap (₹, 0 = no limit)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 150"
                                        value={formData.maxDiscount}
                                        onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Min Order Amount (₹)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 299"
                                        value={formData.minOrderAmount}
                                        onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Usage Limit Per User</label>
                                    <input
                                        type="number"
                                        placeholder="100"
                                        value={formData.usageLimit}
                                        onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Expiry Date *</label>
                                <input
                                    type="date"
                                    value={formData.expiryDate}
                                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 mt-2"
                            >
                                {saving ? "Saving..." : editId ? "Update Coupon" : "Create Coupon"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Coupons;

