import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Divider from './Divider';
import Axios, { setIsLoggingOut } from './../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { logout, updateUserPoints } from '../store/userSlice';
import { clearCart } from '../store/cartProduct';
import { toast } from 'react-hot-toast';
import AxiosToastError from './../utils/AxiosToastError';
import { BiLinkExternal, BiRefresh } from 'react-icons/bi';
// import isAdmin from '../utils/isAdmin';
import GradientText from './GradientText';
import isAdmin from '@/utils/isAdmin';
import { RiExternalLinkFill } from 'react-icons/ri';
import defaultAvatar from '@/assets/defaultAvatar.png';

const UserMenu = ({ close }) => {
    const user = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const menuRef = useRef();
    const [isLoadingPoints, setIsLoadingPoints] = useState(false);

    // Function to fetch user points
    const fetchUserPoints = useCallback(async () => {
        try {
            setIsLoadingPoints(true);
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await Axios.get(SummaryApi.user_points.url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success && response.data.data) {
                dispatch(updateUserPoints(response.data.data.points || 0));
            }
        } catch (error) {
            console.error('Error fetching user points:', error);
        } finally {
            setIsLoadingPoints(false);
        }
    }, [dispatch]);

    // Fetch points when menu opens
    useEffect(() => {
        const fetchData = async () => {
            if (user?._id) {
                await fetchUserPoints();
            }
        };

        fetchData();
    }, [user?._id, fetchUserPoints]);

    // Function to check if a path is active
    const isActive = (path) => {
        // Exact match for root path
        if (path === '/dashboard' && location.pathname === '/dashboard')
            return true;
        // Check if current path starts with the given path (for nested routes)
        return location.pathname.startsWith(path) && path !== '/dashboard';
    };

    const handleLogout = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.logout,
            });

            if (response.data.success) {
                if (close) {
                    close();
                }
                // Clear Redux state immediately
                dispatch(logout());
                dispatch(clearCart());
                setIsLoggingOut(true);

                // Clear localStorage
                localStorage.removeItem('accesstoken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('checkoutSelectedItems');

                toast.success(response.data.message);
                navigate('/');
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    const handleClose = () => {
        if (close) {
            close();
        }
    };

    return (
        <div
            ref={menuRef}
            className="bg-black text-muted-foreground rounded-lg shadow-lg overflow-hidden w-full"
        >
            <div className="p-4 py-2">
                <div className="flex items-center gap-3">
                    <Link
                        to={'/dashboard/profile'}
                        className="relative w-16 hover:opacity-85"
                    >
                        <img
                            src={user?.avatar || defaultAvatar}
                            alt={user?.name}
                            className="w-16 h-16 p-0.5 rounded-full object-cover border-2 border-red-600"
                        />
                        {user.role === 'ADMIN' && (
                            <span
                                className="absolute -bottom-1 bg-rose-600 text-white text-xs font-medium
                                        px-2.5 py-0.5 rounded-full"
                            >
                                Quản trị
                            </span>
                        )}
                    </Link>
                    <div className="min-w-0 text-white">
                        <Link
                            to={'/dashboard/profile'}
                            className="flex items-center gap-1 text-sm font-bold truncate
                                    hover:opacity-80"
                            title="Tài khoản"
                        >
                            {user?.name}
                            <RiExternalLinkFill className="mb-2" />
                        </Link>
                        <p className="text-xs truncate">{user?.email}</p>
                    </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                    <GradientText
                        colors={[
                            '#FFD700',
                            '#FFB300',
                            '#FF8C00',
                            '#FF4500',
                            '#B22222',
                        ]}
                        animationSpeed={3}
                        showBorder={false}
                        className="custom-class"
                    >
                        <span className="text-xs">Điểm tích lũy:</span>
                        {isLoadingPoints ? (
                            <BiRefresh className="animate-spin" />
                        ) : (
                            <span className="text-xs font-bold px-2">
                                {user?.rewardsPoint?.toLocaleString() || 0}
                            </span>
                        )}
                    </GradientText>
                    <button
                        onClick={fetchUserPoints}
                        disabled={isLoadingPoints}
                        className="text-orange-600 hover:text-orange-400 disabled:opacity-50"
                    >
                        <BiRefresh
                            className={`inline-block ${
                                isLoadingPoints ? 'animate-spin' : ''
                            }`}
                        />
                    </button>
                </div>
            </div>
            <Divider />
            <div className="lg:text-sm text-xs grid gap-2 font-semibold">
                {isAdmin(user.role) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/category'}
                        className={`flex items-center text-bl gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                            isActive('/dashboard/category')
                                ? 'bg-white/20 shadow-md'
                                : ''
                        }`}
                    >
                        <span className="text-white font-medium text-sm">
                            Quản Lý Danh Mục
                        </span>
                    </Link>
                )}

                {isAdmin(user.role) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/sub-category'}
                        className={`flex items-center text-bl gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                            isActive('/dashboard/sub-category')
                                ? 'bg-white/20 shadow-md'
                                : ''
                        }`}
                    >
                        <span className="text-white font-medium text-sm">
                            Quản Lý Danh Mục Phụ
                        </span>
                    </Link>
                )}

                {isAdmin(user.role) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/product'}
                        className={`flex items-center text-bl gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                            isActive('/dashboard/product')
                                ? 'bg-white/20 shadow-md'
                                : ''
                        }`}
                    >
                        <span className="text-white font-medium text-sm">
                            Quản Lý Sản Phẩm
                        </span>
                    </Link>
                )}

                {isAdmin(user.role) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/table'}
                        className={`flex items-center text-bl gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                            isActive('/dashboard/table')
                                ? 'bg-white/20 shadow-md'
                                : ''
                        }`}
                    >
                        <span className="text-white font-medium text-sm">
                            Quản lý Bàn Ăn
                        </span>
                    </Link>
                )}

                {isAdmin(user.role) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/booking'}
                        className={`flex items-center text-bl gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                            isActive('/dashboard/booking')
                                ? 'bg-white/20 shadow-md'
                                : ''
                        }`}
                    >
                        <span className="text-white font-medium text-sm">
                            Quản lý Danh Sách Đặt Bàn
                        </span>
                    </Link>
                )}

                {/* Employee Management - Admin/Manager */}
                {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/employee-management'}
                        className={`flex items-center text-bl gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                            isActive('/dashboard/employee-management')
                                ? 'bg-white/20 shadow-md'
                                : ''
                        }`}
                    >
                        <span className="text-white font-medium text-sm">
                            Quản lý Nhân viên
                        </span>
                    </Link>
                )}

                {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/shift-management'}
                        className={`flex items-center text-bl gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                            isActive('/dashboard/shift-management')
                                ? 'bg-white/20 shadow-md'
                                : ''
                        }`}
                    >
                        <span className="text-white font-medium text-sm">
                            Quản lý Ca làm
                        </span>
                    </Link>
                )}

                {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/attendance-management'}
                        className={`flex items-center text-bl gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                            isActive('/dashboard/attendance-management')
                                ? 'bg-white/20 shadow-md'
                                : ''
                        }`}
                    >
                        <span className="text-white font-medium text-sm">
                            Quản lý Chấm công
                        </span>
                    </Link>
                )}

                {/* Employee Dashboard - For all employees */}
                {['WAITER', 'CHEF', 'CASHIER', 'MANAGER'].includes(
                    user.role
                ) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/employee-dashboard'}
                        className={`flex items-center text-bl gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                            isActive('/dashboard/employee-dashboard')
                                ? 'bg-white/20 shadow-md'
                                : ''
                        }`}
                    >
                        <span className="text-white font-medium text-sm">
                            Dashboard Nhân viên
                        </span>
                    </Link>
                )}

                {/* My Shifts - For all employees */}
                {['WAITER', 'CHEF', 'CASHIER', 'MANAGER'].includes(
                    user.role
                ) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/my-shifts'}
                        className={`flex items-center text-bl gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                            isActive('/dashboard/my-shifts')
                                ? 'bg-white/20 shadow-md'
                                : ''
                        }`}
                    >
                        <span className="text-white font-medium text-sm">
                            Ca làm của tôi
                        </span>
                    </Link>
                )}

                {/* My Performance - For all employees */}
                {['WAITER', 'CHEF', 'CASHIER', 'MANAGER'].includes(
                    user.role
                ) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/my-performance'}
                        className={`flex items-center text-bl gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                            isActive('/dashboard/my-performance')
                                ? 'bg-white/20 shadow-md'
                                : ''
                        }`}
                    >
                        <span className="text-white font-medium text-sm">
                            Hiệu suất của tôi
                        </span>
                    </Link>
                )}

                {isAdmin(user.role) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/bill'}
                        className={`flex items-center text-bl gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                            isActive('/dashboard/bill')
                                ? 'bg-white/20 shadow-md'
                                : ''
                        }`}
                    >
                        <span className="text-white font-medium text-sm">
                            Quản lý Danh Sách Hóa Đơn
                        </span>
                    </Link>
                )}

                {isAdmin(user.role) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/report'}
                        className={`flex items-center text-bl gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                            isActive('/dashboard/report')
                                ? 'bg-white/20 shadow-md'
                                : ''
                        }`}
                    >
                        <span className="text-white font-medium text-sm">
                            Báo Cáo Thống Kê
                        </span>
                    </Link>
                )}

                {isAdmin(user.role) && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/voucher'}
                        className={`flex items-center text-bl gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                            isActive('/dashboard/voucher')
                                ? 'bg-white/20 shadow-md'
                                : ''
                        }`}
                    >
                        <span className="text-white font-medium text-sm">
                            Quản Lý Mã Giảm Giá
                        </span>
                    </Link>
                )}

                {user.role !== 'ADMIN' && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/address'}
                        className={`flex items-center text-bl gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                            isActive('/dashboard/address')
                                ? 'bg-white/20 shadow-md'
                                : ''
                        }`}
                    >
                        <span className="text-white font-medium text-sm">
                            Địa chỉ
                        </span>
                    </Link>
                )}

                {user.role !== 'ADMIN' && (
                    <Link
                        onClick={handleClose}
                        to={'/dashboard/my-orders'}
                        className={`flex items-center text-bl gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${
                            isActive('/dashboard/my-orders')
                                ? 'bg-white/20 shadow-md'
                                : ''
                        }`}
                    >
                        <span className="text-white font-medium text-sm">
                            Lịch sử mua hàng
                        </span>
                    </Link>
                )}

                <Divider />
                <div className="pb-2">
                    <button
                        onClick={handleLogout}
                        className="text-white w-full text-sm text-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer hover:bg-white/15 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserMenu;
