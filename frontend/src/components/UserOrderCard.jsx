import axios from 'axios'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { serverUrl } from '../App'

function UserOrderCard({ data }) {
    const navigate = useNavigate()
    const [selectedRating, setSelectedRating] = useState({}) // itemId: rating

    if (!data) return null;

    const formatDate = (dateString) => {
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return "N/A"
        return date.toLocaleString('en-GB', {
            day: "2-digit",
            month: "short",
            year: "numeric"
        })
    }

    const handleRating = async (itemId, rating) => {
        if (!itemId) return
        try {
            await axios.post(`${serverUrl}/api/item/rating`, { itemId, rating }, { withCredentials: true })
            setSelectedRating(prev => ({
                ...prev, [itemId]: rating
            }))
        } catch (error) {
            console.log(error)
        }
    }

    const orderIdShort = data._id ? String(data._id).slice(-6) : "N/A"
    const shopOrdersList = Array.isArray(data.shopOrders)
        ? data.shopOrders
        : data.shopOrders ? [data.shopOrders] : []

    const overallStatus = shopOrdersList[0]?.status || "Pending"

    return (
        <div className='bg-white rounded-xl shadow-md p-5 space-y-4 border border-orange-100'>
            <div className='flex justify-between items-center border-b border-gray-100 pb-3'>
                <div>
                    <p className='font-bold text-gray-800 text-base'>
                        Order #{orderIdShort}
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>
                        Date: {formatDate(data.createdAt)}
                    </p>
                </div>
                <div className='text-right'>
                    {data.paymentMethod === "cod" ? (
                        <span className='inline-block px-2.5 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700 uppercase'>
                            COD
                        </span>
                    ) : (
                        <span className={`inline-block px-2.5 py-1 rounded text-xs font-semibold ${data.payment ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {data.payment ? "Paid (Online)" : "Payment Pending"}
                        </span>
                    )}
                    <p className='font-semibold text-sm capitalize text-[#ff4d2d] mt-1'>
                        {overallStatus}
                    </p>
                </div>
            </div>

            {shopOrdersList.map((shopOrder, index) => {
                const shopName = shopOrder?.shop?.name || "Restaurant"
                const itemsList = Array.isArray(shopOrder?.shopOrderItems) ? shopOrder.shopOrderItems : []

                return (
                    <div className='border border-orange-100 rounded-lg p-3 bg-[#fffaf7] space-y-3' key={shopOrder?._id || index}>
                        <p className='font-semibold text-gray-800 text-sm'>{shopName}</p>

                        <div className='flex space-x-4 overflow-x-auto pb-2'>
                            {itemsList.map((item, itemIdx) => {
                                const itemImg = item?.item?.image || item?.image || "https://placehold.co/160x100?text=Food"
                                const itemId = item?.item?._id || item?.item || item?._id || itemIdx
                                const itemName = item?.name || item?.item?.name || "Food Item"
                                const itemPrice = item?.price ?? item?.item?.price ?? 0
                                const itemQty = item?.quantity ?? 1

                                return (
                                    <div key={itemId || itemIdx} className='flex-shrink-0 w-40 border border-gray-100 rounded-lg p-2 bg-white shadow-sm'>
                                        <img
                                            src={itemImg}
                                            alt={itemName}
                                            className='w-full h-24 object-cover rounded'
                                            onError={(e) => { e.target.src = "https://placehold.co/160x100?text=Food" }}
                                        />
                                        <p className='text-sm font-semibold mt-1 truncate text-gray-800'>{itemName}</p>
                                        <p className='text-xs text-gray-500'>Qty: {itemQty} x ₹{itemPrice}</p>

                                        {shopOrder?.status === "delivered" && (
                                            <div className='flex space-x-1 mt-2'>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        className={`text-lg transition-transform hover:scale-110 ${selectedRating[itemId] >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                                        onClick={() => handleRating(itemId, star)}
                                                    >
                                                        ★
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div className='flex justify-between items-center border-t border-gray-100 pt-2 text-sm'>
                            <p className='font-semibold text-gray-700'>Subtotal: ₹{shopOrder?.subtotal ?? 0}</p>
                            <span className='font-medium capitalize text-blue-600'>{shopOrder?.status || "Pending"}</span>
                        </div>
                    </div>
                )
            })}

            <div className='flex justify-between items-center border-t border-gray-100 pt-3'>
                <p className='font-bold text-gray-900 text-base'>
                    Total: ₹{data?.totalAmount ?? 0}
                </p>
                {data?._id && (
                    <button
                        className='bg-[#ff4d2d] hover:bg-[#e64526] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition'
                        onClick={() => navigate(`/track-order/${data._id}`)}
                    >
                        Track Order
                    </button>
                )}
            </div>
        </div>
    )
}

export default UserOrderCard
