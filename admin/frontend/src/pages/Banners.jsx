import { useState, useEffect } from "react";
import { getBanners, createBanner, updateBanner, deleteBanner, toggleBannerStatus } from "../api";
import { toast } from "react-toastify";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlineSearch, HiOutlinePhotograph, HiOutlineExternalLink } from "react-icons/hi";

const Banners = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({ title: "", subtitle: "", type: "home", link: "", order: "0", isActive: true });
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchBanners();
    }, [selectedType, statusFilter]);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const params = {};
            if (selectedType) params.type = selectedType;
            if (statusFilter) params.status = statusFilter;
            const { data } = await getBanners(params);
            const list = Array.isArray(data) ? data : (data?.banners || []);
            setBanners(list);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch banners");
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const fd = new FormData();
        Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
        if (image) fd.append("image", image);

        try {
            if (editId) {
                const { data } = await updateBanner(editId, fd);
                if (data) toast.success("Banner updated successfully");
            } else {
                if (!image) {
                    toast.error("Please select a banner image");
                    setSaving(false);
                    return;
                }
                const { data } = await createBanner(fd);
                if (data) toast.success("Banner created successfully");
            }
            setShowModal(false);
            resetForm();
            fetchBanners();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this banner?")) return;
        try {
            await deleteBanner(id);
            toast.success("Banner deleted successfully");
            fetchBanners();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete banner");
        }
    };

    const handleToggle = async (id) => {
        try {
            await toggleBannerStatus(id);
            toast.success("Banner status updated");
            fetchBanners();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to toggle status");
        }
    };

    const openEditModal = (banner) => {
        setEditId(banner._id);
        setFormData({
            title: banner.title || "",
            subtitle: banner.subtitle || "",
            type: banner.type || "home",
            link: banner.link || "",
            order: (banner.order ?? 0).toString(),
            isActive: banner.isActive !== false
        });
        setImage(null);
        setImagePreview(banner.image || null);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({ title: "", subtitle: "", type: "home", link: "", order: "0", isActive: true });
        setImage(null);
        setImagePreview(null);
        setEditId(null);
    };

    const typeColors = {
        home: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
        offer: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
        festival: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800",
        promotional: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
    };

    const filteredBanners = banners.filter(b => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (b.title && b.title.toLowerCase().includes(q)) || (b.subtitle && b.subtitle.toLowerCase().includes(q));
    });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Promotional Banners</h1>
                    <p className="text-sm text-gray-500">{filteredBanners.length} banners shown ({banners.length} total)</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-semibold rounded-xl shadow-md transition-all active:scale-95"
                >
                    <HiOutlinePlus className="w-5 h-5" /> Add New Banner
                </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 items-center justify-between">
                <div className="relative flex-1 min-w-[220px]">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search banners by title or subtitle..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
                    >
                        <option value="">All Types</option>
                        <option value="home">Home</option>
                        <option value="offer">Offer</option>
                        <option value="festival">Festival</option>
                        <option value="promotional">Promotional</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>
                </div>
            </div>

            {/* Banners Grid */}
            {loading ? (
                <LoadingSkeleton count={6} />
            ) : filteredBanners.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
                    <HiOutlinePhotograph className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">No Banners Found</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                        {searchTerm ? "No banners match your search keywords." : "You haven't created any promotional banners yet."}
                    </p>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg inline-flex items-center gap-2"
                    >
                        <HiOutlinePlus className="w-4 h-4" /> Create Banner
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredBanners.map((banner) => (
                        <div
                            key={banner._id}
                            className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all flex flex-col justify-between"
                        >
                            <div>
                                <div className="h-44 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                                    {banner.image ? (
                                        <img
                                            src={banner.image}
                                            alt={banner.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=60";
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <HiOutlinePhotograph className="w-10 h-10" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize shadow-sm ${typeColors[banner.type] || "bg-gray-100 text-gray-700"}`}>
                                            {banner.type || "home"}
                                        </span>
                                        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-black/60 text-white backdrop-blur-sm shadow-sm">
                                            Order: {banner.order ?? 0}
                                        </span>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${banner.isActive ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                                            {banner.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 space-y-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-1">{banner.title}</h3>
                                    {banner.subtitle && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{banner.subtitle}</p>
                                    )}
                                    {banner.link && (
                                        <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 truncate">
                                            <HiOutlineExternalLink className="w-3.5 h-3.5 shrink-0" />
                                            <a href={banner.link} target="_blank" rel="noreferrer" className="hover:underline truncate">
                                                {banner.link}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <button
                                    onClick={() => handleToggle(banner._id)}
                                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                                        banner.isActive
                                            ? "border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                    }`}
                                >
                                    {banner.isActive ? "Deactivate" : "Activate"}
                                </button>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => openEditModal(banner)}
                                        className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg text-emerald-600 transition-colors"
                                        title="Edit banner"
                                    >
                                        <HiOutlinePencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(banner._id)}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-red-600 transition-colors"
                                        title="Delete banner"
                                    >
                                        <HiOutlineTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 my-8" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editId ? "Edit Banner" : "Create New Banner"}
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
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Banner Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 50% Off On First Order!"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Subtitle / Description</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Valid until midnight on select restaurants"
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Banner Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white"
                                    >
                                        <option value="home">Home</option>
                                        <option value="offer">Offer</option>
                                        <option value="festival">Festival</option>
                                        <option value="promotional">Promotional</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Display Order</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Link URL (optional)</label>
                                <input
                                    type="text"
                                    placeholder="https://... or /foods"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-white"
                                />
                            </div>

                            {/* Image Upload with Preview */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Banner Image {editId ? "(Leave empty to keep existing)" : "*"}
                                </label>
                                {imagePreview && (
                                    <div className="mb-2 relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-32 bg-gray-100">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 dark:file:bg-orange-950/40 dark:file:text-orange-400"
                                    required={!editId && !imagePreview}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 mt-2"
                            >
                                {saving ? "Saving..." : editId ? "Update Banner" : "Publish Banner"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Banners;

