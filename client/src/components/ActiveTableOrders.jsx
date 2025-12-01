import React, { useState, useEffect } from 'react';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import Loading from '../components/Loading';
import { format } from 'date-fns';

const ActiveTableOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.get_all_active_table_orders,
            });

            if (response.data.success) {
                setOrders(response.data.data);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // Poll for updates every 30 seconds
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading && orders.length === 0) {
        return <Loading />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {orders.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-500">
                    Hiện không có bàn nào đang gọi món
                </div>
            ) : (
                orders.map((order) => (
                    <div
                        key={order._id}
                        className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
                    >
                        <div className="bg-orange-500 text-white p-3 flex justify-between items-center">
                            <h3 className="font-bold text-lg">
                                Bàn {order.tableNumber}
                            </h3>
                            <span className="text-sm bg-white text-orange-500 px-2 py-1 rounded-full font-semibold">
                                {order.items.length} món
                            </span>
                        </div>
                        <div className="p-4 max-h-64 overflow-y-auto">
                            <ul className="space-y-2">
                                {order.items.map((item, index) => (
                                    <li
                                        key={index}
                                        className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-0"
                                    >
                                        <div>
                                            <span className="font-medium text-gray-800">
                                                {item.name}
                                            </span>
                                            <div className="text-xs text-gray-500">
                                                {format(
                                                    new Date(item.addedAt),
                                                    'HH:mm'
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-orange-600">
                                                x{item.quantity}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-gray-50 p-3 border-t border-gray-200 flex justify-between items-center">
                            <span className="font-semibold text-gray-600">
                                Tổng cộng:
                            </span>
                            <span className="font-bold text-xl text-orange-600">
                                {order.total.toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ActiveTableOrders;
