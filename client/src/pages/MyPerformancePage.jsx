import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Loading from '../components/Loading';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import { FaClock, FaUtensils, FaStar, FaConciergeBell } from 'react-icons/fa';

const MyPerformancePage = () => {
    const user = useSelector((state) => state.user);
    const [loading, setLoading] = useState(false);
    const [performanceData, setPerformanceData] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]);
    const [timeRange, setTimeRange] = useState('week'); // week, month

    const fetchPerformanceData = async () => {
        try {
            setLoading(true);

            // Fetch overall performance stats
            const perfResponse = await Axios({
                ...SummaryApi.get_performance_stats,
                url: SummaryApi.get_performance_stats.url.replace(
                    ':employeeId',
                    user._id
                ),
            });

            if (perfResponse.data.success) {
                setPerformanceData(perfResponse.data.data);
            }

            // Fetch attendance history for charts
            const attResponse = await Axios({
                ...SummaryApi.get_attendance_by_employee,
                url: SummaryApi.get_attendance_by_employee.url.replace(
                    ':employeeId',
                    user._id
                ),
            });

            if (attResponse.data.success) {
                setAttendanceData(attResponse.data.data.attendances || []);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?._id) {
            fetchPerformanceData();
        }
    }, [user]);

    // Process data for charts
    const getChartData = () => {
        if (!attendanceData.length) return [];

        const now = new Date();
        const days = timeRange === 'week' ? 7 : 30;
        const startDate = new Date(now.setDate(now.getDate() - days));

        // Filter and sort attendance data
        const filteredData = attendanceData
            .filter((item) => new Date(item.checkInTime) >= startDate)
            .sort((a, b) => new Date(a.checkInTime) - new Date(b.checkInTime));

        // Group by date
        const groupedData = {};
        filteredData.forEach((item) => {
            const dateStr = new Date(item.checkInTime).toLocaleDateString(
                'vi-VN',
                {
                    day: '2-digit',
                    month: '2-digit',
                }
            );
            if (!groupedData[dateStr]) {
                groupedData[dateStr] = {
                    date: dateStr,
                    hours: 0,
                    orders: 0, // Placeholder, real data would come from orders API
                    dishes: 0, // Placeholder
                };
            }
            groupedData[dateStr].hours += item.workingHours || 0;
        });

        return Object.values(groupedData);
    };

    const chartData = getChartData();

    // Calculate summary stats
    const totalHours = attendanceData.reduce(
        (acc, curr) => acc + (curr.workingHours || 0),
        0
    );
    const avgHoursPerDay = attendanceData.length
        ? (totalHours / attendanceData.length).toFixed(1)
        : 0;

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Hiệu suất của tôi</h1>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Chọn thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="week">7 ngày qua</SelectItem>
                        <SelectItem value="month">30 ngày qua</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loading />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Tổng giờ làm việc
                                </CardTitle>
                                <FaClock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {totalHours.toFixed(1)}h
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Trung bình {avgHoursPerDay}h/ngày
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {user.role === 'CHEF'
                                        ? 'Món ăn đã nấu'
                                        : 'Đơn hàng xử lý'}
                                </CardTitle>
                                {user.role === 'CHEF' ? (
                                    <FaUtensils className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <FaConciergeBell className="h-4 w-4 text-muted-foreground" />
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {user.role === 'CHEF'
                                        ? performanceData?.summary
                                              ?.totalDishesCooked || 0
                                        : performanceData?.summary
                                              ?.totalOrdersHandled || 0}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Tổng số tích lũy
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Đánh giá trung bình
                                </CardTitle>
                                <FaStar className="h-4 w-4 text-yellow-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {performanceData?.summary?.averageRating ||
                                        0}
                                    /5.0
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Dựa trên phản hồi khách hàng
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Working Hours Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Biểu đồ giờ làm việc</CardTitle>
                                <CardDescription>
                                    Số giờ làm việc trong{' '}
                                    {timeRange === 'week'
                                        ? '7 ngày'
                                        : '30 ngày'}{' '}
                                    qua
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="hours"
                                                name="Giờ làm"
                                                stroke="#8884d8"
                                                activeDot={{ r: 8 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Performance Chart (Placeholder for now as we don't have daily order data yet) */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {user.role === 'CHEF'
                                        ? 'Hiệu suất nấu ăn'
                                        : 'Hiệu suất phục vụ'}
                                </CardTitle>
                                <CardDescription>
                                    Dữ liệu mẫu (chưa tích hợp với Order system)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar
                                                dataKey={
                                                    user.role === 'CHEF'
                                                        ? 'dishes'
                                                        : 'orders'
                                                }
                                                name={
                                                    user.role === 'CHEF'
                                                        ? 'Món ăn'
                                                        : 'Đơn hàng'
                                                }
                                                fill="#82ca9d"
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyPerformancePage;
