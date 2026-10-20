import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import UserOrderCard from '../components/UserOrderCard';
import OwnerOrderCard from '../components/OwnerOrderCard';
import { setMyOrders, updateOrderStatus, updateRealtimeOrderStatus } from '../redux/userSlice';
import axios from 'axios';
import { serverUrl } from '../App';

function MyOrders() {
  const { userData, myOrders, socket } = useSelector(state => state.user)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const result = await axios.get(`${serverUrl}/api/order/my-orders`, { withCredentials: true })
      if (Array.isArray(result.data)) {
        dispatch(setMyOrders(result.data))
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userData) {
      fetchOrders()
    }
  }, [userData?._id])

  useEffect(() => {
    if (!socket) return

    const handleNewOrder = (data) => {
      if (data?.shopOrders?.owner?._id === userData?._id) {
        dispatch(setMyOrders([data, ...(myOrders || [])]))
      }
    }

    const handleUpdateStatus = ({ orderId, shopId, status, userId }) => {
      if (userId === userData?._id) {
        dispatch(updateRealtimeOrderStatus({ orderId, shopId, status }))
      }
    }

    socket.on('newOrder', handleNewOrder)
    socket.on('update-status', handleUpdateStatus)

    return () => {
      socket.off('newOrder', handleNewOrder)
      socket.off('update-status', handleUpdateStatus)
    }
  }, [socket, userData?._id, myOrders])

  return (
    <div className='w-full min-h-screen bg-[#fff9f6] flex justify-center px-4 py-6'>
      <div className='w-full max-w-[800px] p-4'>

        <div className='flex items-center gap-[20px] mb-6'>
          <button 
            type="button"
            className='z-[10] cursor-pointer p-1 rounded-full hover:bg-orange-100 transition' 
            onClick={() => navigate("/")}
            aria-label="Back to home"
          >
            <IoIosArrowRoundBack size={35} className='text-[#ff4d2d]' />
          </button>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-gray-800 text-start'>My Orders</h1>
        </div>

        <div className='space-y-6'>
          {loading && (!myOrders || myOrders.length === 0) ? (
            <div className='flex flex-col items-center justify-center py-20 text-gray-500'>
              <div className='w-10 h-10 border-4 border-[#ff4d2d] border-t-transparent rounded-full animate-spin mb-4'></div>
              <p className='font-medium text-sm'>Loading your orders...</p>
            </div>
          ) : myOrders && myOrders.length > 0 ? (
            myOrders.map((order, index) => (
              userData?.role === "user" ? (
                <UserOrderCard data={order} key={order?._id || index} />
              ) : userData?.role === "owner" ? (
                <OwnerOrderCard data={order} key={order?._id || index} />
              ) : null
            ))
          ) : (
            <div className='bg-white rounded-2xl p-10 shadow-sm text-center border border-orange-100 flex flex-col items-center mt-6'>
              <div className='w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-4xl mb-4'>
                📦
              </div>
              <h2 className='text-2xl font-bold text-gray-800 mb-2'>No Orders Yet</h2>
              <p className='text-sm text-gray-500 max-w-sm mb-6'>
                You haven't placed any orders yet. Discover the best food from top restaurants near you!
              </p>
              <button
                className='bg-[#ff4d2d] hover:bg-[#e64526] text-white px-8 py-3 rounded-full font-semibold transition-all shadow-md hover:shadow-lg'
                onClick={() => navigate('/')}
              >
                Browse Restaurants
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MyOrders
