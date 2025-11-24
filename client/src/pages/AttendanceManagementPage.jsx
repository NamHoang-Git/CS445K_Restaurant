import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import Loading from '../components/Loading';

const AttendanceManagementPage = () => {
    const user = useSelector((state) => state.user);
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    // Fetch attendance by date
    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.get_attendance_by_date,
                url: SummaryApi.get_attendance_by_date.url.replace(
                    ':date',
                    selectedDate
                ),
            });

            if (response.data.success) {
                setAttendances(response.data.data);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedDate) {
            fetchAttendance();
        }
    }, [selectedDate]);

    const formatTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            on_time: {
                label: 'Đúng giờ',
                class: 'bg-green-100 text-green-800',
            },
            late: { label: 'Muộn', class: 'bg-yellow-100 text-yellow-800' },
            early_leave: {
                label: 'Về sớm',
                class: 'bg-orange-100 text-orange-800',
            },
            absent: { label: 'Vắng', class: 'bg-red-100 text-red-800' },
        };
        const s = statusMap[status] || {
            label: status,
            class: 'bg-gray-100 text-gray-800',
        };
        return (
            <span className={`px-2 py-1 rounded text-xs ${s.class}`}>
                {s.label}
            </span>
        );
    };

    // Check permission
    if (!['ADMIN', 'MANAGER'].includes(user?.role)) {
        return (
            <div className="container mx-auto py-8 px-4">
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-red-500">
                            Bạn không có quyền truy cập trang này
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        Quản lý Chấm công
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Date Filter */}
                    <div className="mb-6 max-w-xs">
                        <Label>Chọn ngày</Label>
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>

                    {/* Attendance Table */}
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loading />
                        </div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <p className="text-sm text-muted-foreground">
                                    Tổng số: {attendances.length} bản ghi
                                </p>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nhân viên</TableHead>
                                        <TableHead>Vai trò</TableHead>
                                        <TableHead>Ca làm</TableHead>
                                        <TableHead>Giờ vào</TableHead>
                                        <TableHead>Giờ ra</TableHead>
                                        <TableHead>Số giờ</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendances.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="text-center"
                                            >
                                                Không có dữ liệu chấm công
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        attendances.map((att) => (
                                            <TableRow key={att._id}>
                                                <TableCell>
                                                    {att.userId?.name || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                        {att.userId?.role ||
                                                            '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="capitalize">
                                                    {att.shiftId?.shiftType ||
                                                        '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {formatTime(
                                                        att.checkInTime
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {formatTime(
                                                        att.checkOutTime
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {att.workingHours
                                                        ? `${att.workingHours.toFixed(
                                                              2
                                                          )}h`
                                                        : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(att.status)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AttendanceManagementPage;
