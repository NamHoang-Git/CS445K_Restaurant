import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Loading from '../components/Loading';
import DynamicTable from '@/components/table/dynamic-table';

const AttendanceManagementPage = () => {
    const user = useSelector((state) => state.user);
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    const [showMyShifts, setShowMyShifts] = useState(false);

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

    // Column configuration for DynamicTable
    const columns = useMemo(
        () => [
            {
                key: 'employeeName',
                label: 'Nhân viên',
                type: 'string',
                sortable: true,
                format: (value) => value || '-',
            },
            {
                key: 'role',
                label: 'Vai trò',
                type: 'string',
                sortable: true,
                format: (value) => (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {value || '-'}
                    </span>
                ),
            },
            {
                key: 'shiftType',
                label: 'Ca làm',
                type: 'string',
                sortable: true,
                format: (value) => (
                    <span className="capitalize">{value || '-'}</span>
                ),
            },
            {
                key: 'checkInTime',
                label: 'Giờ vào',
                type: 'string',
                sortable: true,
                format: (value) => formatTime(value),
            },
            {
                key: 'checkOutTime',
                label: 'Giờ ra',
                type: 'string',
                sortable: true,
                format: (value) => formatTime(value),
            },
            {
                key: 'workingHours',
                label: 'Số giờ',
                type: 'number',
                sortable: true,
                format: (value) => (value ? `${value.toFixed(2)}h` : '-'),
            },
            {
                key: 'status',
                label: 'Trạng thái',
                type: 'string',
                sortable: true,
                format: (value) => {
                    const statusMap = {
                        on_time: {
                            label: 'Đúng giờ',
                            class: 'bg-green-100 text-green-800',
                        },
                        late: {
                            label: 'Muộn',
                            class: 'bg-yellow-100 text-yellow-800',
                        },
                        early_leave: {
                            label: 'Về sớm',
                            class: 'bg-orange-100 text-orange-800',
                        },
                        absent: {
                            label: 'Vắng',
                            class: 'bg-red-100 text-red-800',
                        },
                    };
                    const s = statusMap[value] || {
                        label: value,
                        class: 'bg-gray-100 text-gray-800',
                    };
                    return (
                        <span
                            className={`px-2 py-1 rounded text-xs ${s.class}`}
                        >
                            {s.label}
                        </span>
                    );
                },
            },
        ],
        []
    );

    // Transform data for DynamicTable
    const tableData = useMemo(() => {
        let filtered = attendances;

        if (showMyShifts) {
            filtered = filtered.filter((att) => att.userId?._id === user?._id);
        }

        return filtered.map((att, index) => ({
            id: index + 1,
            employeeName: att.userId?.name,
            role: att.userId?.role,
            shiftType: att.shiftId?.shiftType,
            checkInTime: att.checkInTime,
            checkOutTime: att.checkOutTime,
            workingHours: att.workingHours,
            status: att.status,
            rawData: att,
        }));
    }, [attendances, showMyShifts, user?._id]);

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
        <section className="container mx-auto grid gap-2 z-10">
            <Card className="py-6 flex-row justify-between gap-6 border-card-foreground">
                <CardHeader>
                    <CardTitle className="text-lg text-highlight font-bold uppercase">
                        Quản lý Chấm công
                    </CardTitle>
                    <CardDescription>
                        Quản lý thông tin chấm công
                    </CardDescription>
                </CardHeader>

                <CardFooter className="flex gap-4 items-end">
                    {/* Date Filter */}
                    <div className="space-y-2">
                        <Label>Chọn ngày</Label>
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>

                    {/* My Shifts Toggle */}
                    <Button
                        variant={showMyShifts ? 'default' : 'outline'}
                        onClick={() => setShowMyShifts(!showMyShifts)}
                        className="mb-0.5"
                    >
                        Ca làm của tôi
                    </Button>
                </CardFooter>
            </Card>

            {/* Attendance Table */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loading />
                </div>
            ) : (
                <>
                    <Card className="mb-4 p-4">
                        <p className="text-sm text-foreground">
                            Tổng số: {attendances.length} bản ghi
                        </p>
                    </Card>
                    <DynamicTable
                        data={tableData}
                        columns={columns}
                        pageSize={10}
                        sortable={true}
                        searchable={false}
                        filterable={false}
                        groupable={false}
                    />
                </>
            )}
        </section>
    );
};

export default AttendanceManagementPage;
