import { useState, useEffect } from "react";
import {
    getRevenueAnalytics, getOrdersAnalytics, getRestaurantAnalytics,
    getFoodAnalytics, getUserGrowthAnalytics, getDeliveryPerformance,
    getPeakOrderingTimes, getPaymentAnalytics
} from "../api";
import LoadingSkeleton from "../components/LoadingSkeleton";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { HiOutlineCurrencyRupee, HiOutlineShoppingBag, HiOutlineClock, HiOutlineCheckCircle } from "react-icons/hi";

const COLORS = ["#f97316", "#ef4444", "#8b5cf6", "#22c55e", "#3b82f6", "#eab308", "#ec4899", "#14b8a6"];

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [revenueData, setRevenueData] = useState([]);
    const [ordersData, setOrdersData] = useState([]);
    const [restaurantData, setRestaurantData] = useState([]);
    const [foodData, setFoodData] = useState(null);
    const [userGrowth, setUserGrowth] = useState([]);
    const [deliveryPerf, setDeliveryPerf] = useState(null);
    const [peakTimes, setPeakTimes] = useState([]);
    const [paymentData, setPaymentData] = useState([]);

    useEffect(() => {
        fetchAllAnalytics();
    }, []);

    const fetchAllAnalytics = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                getRevenueAnalytics(),
                getOrdersAnalytics(),
                getRestaurantAnalytics(),
                getFoodAnalytics(),
                getUserGrowthAnalytics(),
                getDeliveryPerformance(),
                getPeakOrderingTimes(),
                getPaymentAnalytics()
            ]);

            const [rev, ord, rest, food, growth, perf, peak, pay] = results.map(r =>
                r.status === "fulfilled" ? r.value : { data: null }
            );

            // Safe parsing for revenue
            const revList = Array.isArray(rev.data) ? rev.data : (rev.data?.monthlyRevenue || []);
            setRevenueData(revList);

            // Safe parsing for orders
            const ordList = Array.isArray(ord.data) ? ord.data : (ord.data?.monthlyOrders || []);
            setOrdersData(ordList);

            // Safe parsing for restaurant
            const restList = Array.isArray(rest.data) ? rest.data : (rest.data?.topRestaurants || []);
            setRestaurantData(restList);

            // Food data
            setFoodData(food.data || null);

            // User growth
            const growthList = Array.isArray(growth.data) ? growth.data : (growth.data?.monthlyGrowth || []);
            setUserGrowth(growthList);

            // Delivery performance
            setDeliveryPerf(perf.data || null);

            // Peak times
            const peakList = Array.isArray(peak.data) ? peak.data : [];
            setPeakTimes(peakList);

            // Payments
            const payList = Array.isArray(pay.data) ? pay.data : [];
            setPaymentData(payList);
        } catch (error) {
            console.error("Analytics fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSkeleton count={6} type="chart" />;

    // Derived KPI numbers
    const totalRevenueSum = revenueData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
    const totalOrdersCount = ordersData.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const avgDeliveryTime = deliveryPerf?.averageDeliveryMinutes || 25;
    const totalDelivered = deliveryPerf?.totalDelivered || 0;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics & Performance</h1>
                <p className="text-sm text-gray-500">Comprehensive platform analytics, user trends, and revenue insights</p>
            </div>

            {/* Quick KPI Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-950/40 text-orange-600 rounded-xl">
                        <HiOutlineCurrencyRupee className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500">Total Analyzed Revenue</p>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">₹{totalRevenueSum.toLocaleString()}</h4>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-950/40 text-blue-600 rounded-xl">
                        <HiOutlineShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500">Total Orders Processed</p>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">{totalOrdersCount}</h4>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
                        <HiOutlineCheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500">Delivered Orders</p>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">{totalDelivered}</h4>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-950/40 text-purple-600 rounded-xl">
                        <HiOutlineClock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500">Avg. Delivery Duration</p>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">{avgDeliveryTime} mins</h4>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Analytics */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Revenue Over Time</h3>
                        <span className="text-xs font-medium px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 rounded-full">Monthly</span>
                    </div>
                    {revenueData.length === 0 ? (
                        <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">No revenue data recorded yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                <XAxis dataKey="_id" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <Tooltip
                                    formatter={(value) => [`₹${value}`, "Revenue"]}
                                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "10px", color: "#fff" }}
                                />
                                <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Orders Breakdown */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Orders & Payment Mode Trends</h3>
                        <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 rounded-full">Breakdown</span>
                    </div>
                    {ordersData.length === 0 ? (
                        <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">No orders data recorded yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={ordersData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                <XAxis dataKey="_id" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "10px", color: "#fff" }} />
                                <Legend />
                                <Line type="monotone" dataKey="total" name="Total Orders" stroke="#f97316" strokeWidth={2.5} dot={{ fill: "#f97316", r: 3 }} />
                                <Line type="monotone" dataKey="cod" name="COD Orders" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", r: 3 }} />
                                <Line type="monotone" dataKey="online" name="Online Orders" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Top Restaurants */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Performing Restaurants</h3>
                    {restaurantData.length === 0 ? (
                        <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">No restaurant orders recorded yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={restaurantData.slice(0, 8)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#6b7280" width={110} />
                                <Tooltip
                                    formatter={(value) => [value, "Orders Received"]}
                                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "10px", color: "#fff" }}
                                />
                                <Bar dataKey="totalOrders" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Food Category Distribution */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Food Menu by Category</h3>
                    {(!foodData?.categoryDistribution || foodData.categoryDistribution.length === 0) ? (
                        <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">No categories found in menu</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={foodData.categoryDistribution}
                                    dataKey="count"
                                    nameKey="_id"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={95}
                                    label={({ _id, percent }) => `${_id || "Uncategorized"} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {foodData.categoryDistribution.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "10px", color: "#fff" }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* User Growth */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">User Growth Trends</h3>
                    {userGrowth.length === 0 ? (
                        <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">No user growth data available</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                <XAxis dataKey="_id" tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "10px", color: "#fff" }} />
                                <Legend />
                                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2.5} name="Customers" dot={{ fill: "#3b82f6", r: 3 }} />
                                <Line type="monotone" dataKey="owners" stroke="#22c55e" strokeWidth={2} name="Restaurant Owners" dot={{ fill: "#22c55e", r: 3 }} />
                                <Line type="monotone" dataKey="deliveryBoys" stroke="#8b5cf6" strokeWidth={2} name="Delivery Partners" dot={{ fill: "#8b5cf6", r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Peak Ordering Times */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Peak Ordering Hours (24-Hour Cycle)</h3>
                    {peakTimes.length === 0 ? (
                        <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">No peak order data available</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={peakTimes}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                <XAxis dataKey="_id" tick={{ fontSize: 10 }} stroke="#6b7280" interval={2} />
                                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                                <Tooltip
                                    formatter={(value) => [value, "Orders Placed"]}
                                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "10px", color: "#fff" }}
                                />
                                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Payment Methods Breakdown */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Payment Methods Ratio</h3>
                    {paymentData.length === 0 ? (
                        <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">No payment data available</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={paymentData}
                                    dataKey="count"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={95}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    {paymentData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name) => [`${value} transactions`, name]}
                                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "10px", color: "#fff" }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Delivery Performance Widget */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Delivery Fleet Performance</h3>
                        <p className="text-xs text-gray-500 mb-6">Efficiency stats across our active delivery fleet and completed trips</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/50 text-center">
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Avg Delivery Time</p>
                            <p className="text-3xl font-extrabold text-blue-700 dark:text-blue-300 mt-2">{avgDeliveryTime} <span className="text-base font-normal">min</span></p>
                            <p className="text-[11px] text-gray-500 mt-1">From order dispatch to doorstep</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 text-center">
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Completed Trips</p>
                            <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-2">{totalDelivered}</p>
                            <p className="text-[11px] text-gray-500 mt-1">Successfully fulfilled orders</p>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 flex items-center justify-between">
                        <span>Status: All delivery services operational</span>
                        <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;

