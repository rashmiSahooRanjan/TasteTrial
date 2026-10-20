import { useState, useEffect } from "react";
import { getNotifications, sendNotification, deleteNotification } from "../api";
import { toast } from "react-toastify";
import LoadingSkeleton from "../components/LoadingSkeleton";
import {
    HiOutlinePlus, HiOutlineTrash, HiOutlineX, HiOutlineMail,
    HiOutlineBell, HiOutlineChatAlt2, HiOutlineSearch, HiOutlineUsers
} from "react-icons/hi";

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [typeFilter, setTypeFilter] = useState("");
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [sending, setSending] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        message: "",
        type: "push",
        recipientType: "all_users",
        recipientIds: ""
    });
    const limit = 15;

    useEffect(() => {
        fetchNotifications();
    }, [page, typeFilter]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const params = { page, limit };
            if (typeFilter) params.type = typeFilter;
            if (search) params.search = search;
            const { data } = await getNotifications(params);
            setNotifications(data?.notifications || []);
            setTotal(data?.total || 0);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch notifications");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setPage(1);
        fetchNotifications();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            const payload = { ...formData };
            if (payload.recipientType === "specific_users" || payload.recipientType === "specific_restaurants") {
                payload.recipientIds = payload.recipientIds
                    ? payload.recipientIds.split(",").map(id => id.trim()).filter(Boolean)
                    : [];
            }
            await sendNotification(payload);
            toast.success("Broadcast notification sent successfully");
            setShowModal(false);
            setFormData({ title: "", message: "", type: "push", recipientType: "all_users", recipientIds: "" });
            fetchNotifications();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send notification");
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this notification record?")) return;
        try {
            await deleteNotification(id);
            toast.success("Notification deleted");
            fetchNotifications();
        } catch (error) {
            toast.error("Failed to delete notification");
        }
    };

    const totalPages = Math.ceil(total / limit);

    const getRecipientLabel = (type) => {
        const str = type || "all_users";
        return str.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Push & System Notifications</h1>
                    <p className="text-sm text-gray-500">{total} notifications broadcasted to platform users</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95"
                >
                    <HiOutlinePlus className="w-5 h-5" /> Send New Notification
                </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 items-center justify-between">
                <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[220px]">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search notifications by title or message..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                    />
                </form>

                <div className="flex items-center gap-2">
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
                    >
                        <option value="">All Channels</option>
                        <option value="push">Push Notification</option>
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                    </select>
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {loading ? (
                    <LoadingSkeleton count={5} />
                ) : notifications.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
                        <HiOutlineBell className="w-14 h-14 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">No Notifications Sent</h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                            Send targeted push notifications or announcements to users, restaurant owners, or delivery boys.
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg inline-flex items-center gap-2"
                        >
                            <HiOutlinePlus className="w-4 h-4" /> Send Notification
                        </button>
                    </div>
                ) : (
                    notifications.map((n) => (
                        <div
                            key={n._id}
                            className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between gap-4"
                        >
                            <div className="flex items-start gap-3.5">
                                <div className={`p-3 rounded-xl shrink-0 ${
                                    n.type === "email"
                                        ? "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                                        : n.type === "sms"
                                        ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                                        : "bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400"
                                }`}>
                                    {n.type === "email" ? (
                                        <HiOutlineMail className="w-5 h-5" />
                                    ) : n.type === "sms" ? (
                                        <HiOutlineChatAlt2 className="w-5 h-5" />
                                    ) : (
                                        <HiOutlineBell className="w-5 h-5" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-base">{n.title}</h4>
                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                                            n.type === "email" ? "bg-blue-50 text-blue-600 border border-blue-200" :
                                            n.type === "sms" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                                            "bg-purple-50 text-purple-600 border border-purple-200"
                                        }`}>
                                            {n.type || "push"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{n.message}</p>
                                    <div className="flex items-center gap-3 pt-1 text-xs text-gray-400 flex-wrap">
                                        <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-md text-gray-600 dark:text-gray-400 font-medium">
                                            <HiOutlineUsers className="w-3.5 h-3.5" />
                                            {getRecipientLabel(n.recipientType || n.targetRole)}
                                        </span>
                                        {n.recipients?.length > 0 && (
                                            <span>{n.recipients.length} recipients</span>
                                        )}
                                        <span>•</span>
                                        <span>{n.createdAt ? new Date(n.createdAt).toLocaleString("en-IN") : "Just now"}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(n._id)}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-red-600 transition-colors shrink-0"
                                title="Delete record"
                            >
                                <HiOutlineTrash className="w-4 h-4" />
                            </button>
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

            {/* Send Notification Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 my-8" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Broadcast Notification</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
                            >
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Subject / Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Flash Sale Alert! ⚡"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white font-medium"
                                    required
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Message Body *</label>
                                    <span className="text-[10px] text-gray-400">{formData.message.length}/500</span>
                                </div>
                                <textarea
                                    placeholder="Type your announcement or alert message here..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    maxLength={500}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none h-28 text-gray-900 dark:text-white resize-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Channel Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white"
                                    >
                                        <option value="push">Push Notification</option>
                                        <option value="email">Email Blast</option>
                                        <option value="sms">SMS Text</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
                                    <select
                                        value={formData.recipientType}
                                        onChange={(e) => setFormData({ ...formData, recipientType: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white"
                                    >
                                        <option value="all_users">All Customers</option>
                                        <option value="all_owners">All Restaurant Owners</option>
                                        <option value="all_delivery_boys">All Delivery Partners</option>
                                        <option value="specific_users">Specific User IDs</option>
                                        <option value="specific_restaurants">Specific Restaurants</option>
                                    </select>
                                </div>
                            </div>

                            {(formData.recipientType === "specific_users" || formData.recipientType === "specific_restaurants") && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Enter Target IDs (Comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="64f123abc, 64f456def..."
                                        value={formData.recipientIds}
                                        onChange={(e) => setFormData({ ...formData, recipientIds: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white font-mono"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 mt-2"
                            >
                                {sending ? "Broadcasting..." : "Dispatch Broadcast"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notifications;

