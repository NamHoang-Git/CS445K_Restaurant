import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import successAlert from '../utils/successAlert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FaClock, FaCheckCircle } from 'react-icons/fa';
import Loading from '../components/Loading';

const EmployeeDashboard = () => {
    const user = useSelector((state) => state.user);
    const [loading, setLoading] = useState(false);
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
        }
    };

    useEffect(() => {
        if (user?._id) {
            fetchCurrentAttendance();
            fetchTodayShifts();
            fetchStats();
        }
    }, [user]);

    // Handle check-in
    const handleCheckIn = async () => {
        if (todayShifts.length === 0) {
            AxiosToastError({
                response: {
                    data: {
                        message: 'Bạn không có ca làm việc hôm nay',
                    },
                },
            });
            return;
        }

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.check_in,
                data: {
                    shiftId: todayShifts[0]._id,
                },
            });

            if (response.data.success) {
                successAlert(response.data.message);
                fetchCurrentAttendance();
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    // Handle check-out
    const handleCheckOut = async () => {
        if (!currentAttendance) {
            return;
        }

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.check_out,
                data: {
                    attendanceId: currentAttendance._id,
                },
            });

            if (response.data.success) {
                successAlert(response.data.message);
                setCurrentAttendance(null);
                fetchStats();
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-6">Dashboard Nhân viên</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Check-in/out Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Chấm công</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {currentAttendance ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-green-600">
                                    <FaCheckCircle />
                                    <span>Đã check-in</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Giờ vào:{' '}
                                    {formatTime(currentAttendance.checkInTime)}
                                </p>
                                <Button
                                    onClick={handleCheckOut}
                                    disabled={loading}
                                    className="w-full bg-red-600 hover:bg-red-700"
                                >
                                    {loading ? <Loading /> : 'Check-out'}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <FaClock />
                                    <span>Chưa check-in</span>
                                </div>
                                <Button
                                    onClick={handleCheckIn}
                                    disabled={
                                        loading || todayShifts.length === 0
                                    }
                                    className="w-full bg-green-600 hover:bg-green-700"
                                >
                                    {loading ? <Loading /> : 'Check-in'}
                                </Button>
                                {todayShifts.length === 0 && (
                                    <p className="text-xs text-red-500">
                                        Không có ca làm việc hôm nay
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Today's Shift */}
                <Card>
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
                <Card>
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
            </div>
        </div>
    );
};

export default EmployeeDashboard;
