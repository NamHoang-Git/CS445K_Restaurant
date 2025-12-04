import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { FaClock, FaCheckCircle } from 'react-icons/fa';

const EmployeeDashboard = () => {
    const user = useSelector((state) => state.user);
    const [currentAttendance, setCurrentAttendance] = useState(null);
    const [todayShifts, setTodayShifts] = useState([]);
    const [stats, setStats] = useState(null);

    // Fetch current attendance
    const fetchCurrentAttendance = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.get_current_attendance,
            });

            if (response.data.success) {
                setCurrentAttendance(response.data.data);
            }
        } catch (error) {
            // Silently fail if no attendance
            AxiosToastError(error);
        }
    };

    // Fetch today's shifts
    const fetchTodayShifts = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await Axios({
                ...SummaryApi.get_shifts_by_employee,
                url: SummaryApi.get_shifts_by_employee.url.replace(
                    ':employeeId',
                    user._id
                ),
                params: {
                    startDate: today,
                    endDate: today,
                },
            });

            if (response.data.success) {
                setTodayShifts(response.data.data);
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    // Fetch performance stats
    const fetchStats = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.get_performance_stats,
                url: SummaryApi.get_performance_stats.url.replace(
                    ':employeeId',
                    user._id
                ),
            });

            if (response.data.success) {
                setStats(response.data.data.summary);
            }
        } catch (error) {
            // Silently fail
            AxiosToastError(error);
        }
    };

    useEffect(() => {
        if (user?._id) {
            fetchCurrentAttendance();
            fetchTodayShifts();
            fetchStats();
        }
    }, [user]);

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <section className="container mx-auto grid gap-2 z-10">
            {/* Header */}
            <Card className="py-6 flex-row justify-between gap-6 border-card-foreground">
                <CardHeader>
                    <CardTitle className="text-lg text-highlight font-bold uppercase">
                        Dashboard Nhân viên
                    </CardTitle>
                    <CardDescription>Dashboard của nhân viên</CardDescription>
                </CardHeader>
            </Card>
            <Card className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-background/80 p-2 rounded-lg">
                {/* Attendance Status Card (Read-only) */}
                <Card className="p-4">
                    <CardHeader>
                        <CardTitle>Chấm công</CardTitle>
                        <CardDescription className="text-xs">
                            Vui lòng liên hệ Quản lý để check-in/out
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {currentAttendance ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-green-600">
                                    <FaCheckCircle />
                                    <span className="font-semibold">
                                        Đang làm việc
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">
                                        Giờ vào:{' '}
                                        <span className="font-medium text-foreground">
                                            {formatTime(
                                                currentAttendance.checkInTime
                                            )}
                                        </span>
                                    </p>
                                    {currentAttendance.checkOutTime && (
                                        <p className="text-sm text-muted-foreground">
                                            Giờ ra:{' '}
                                            <span className="font-medium text-foreground">
                                                {formatTime(
                                                    currentAttendance.checkOutTime
                                                )}
                                            </span>
                                        </p>
                                    )}
                                </div>
                                {!currentAttendance.checkOutTime && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <p className="text-xs text-blue-800">
                                            💡 Nhắc Quản lý check-out khi kết
                                            thúc ca
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <FaClock />
                                    <span>Chưa vào ca</span>
                                </div>
                                {todayShifts.length > 0 ? (
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                        <p className="text-xs text-yellow-800">
                                            ⏰ Nhắc Quản lý check-in khi bắt đầu
                                            ca
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Không có ca làm việc hôm nay
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Today's Shift */}
                <Card className="p-4">
                    <CardHeader>
                        <CardTitle>Ca làm hôm nay</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {todayShifts.length > 0 ? (
                            <div className="space-y-2">
                                {todayShifts.map((shift) => (
                                    <div
                                        key={shift._id}
                                        className="p-3 bg-gray-50 rounded"
                                    >
                                        <p className="font-semibold capitalize">
                                            Ca {shift.shiftType}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {shift.startTime} - {shift.endTime}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">
                                Không có ca làm việc
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Performance Stats */}
                <Card className="p-4">
                    <CardHeader>
                        <CardTitle>Hiệu suất</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats ? (
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Tổng giờ làm
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {stats.totalWorkingHours || 0}h
                                    </p>
                                </div>
                                {user?.role === 'WAITER' && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Đơn hàng xử lý
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {stats.totalOrdersHandled || 0}
                                        </p>
                                    </div>
                                )}
                                {user?.role === 'CHEF' && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Món nấu
                                        </p>
                                        <p className="text-2xl font-bold">
                                            {stats.totalDishesCooked || 0}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">
                                Chưa có dữ liệu
                            </p>
                        )}
                    </CardContent>
                </Card>
            </Card>
        </section>
    );
};

export default EmployeeDashboard;
