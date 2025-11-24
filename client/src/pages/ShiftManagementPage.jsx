import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import successAlert from '../utils/successAlert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { FaPlus, FaEdit, FaTrash, FaUserPlus } from 'react-icons/fa';
import Loading from '../components/Loading';

const ShiftManagementPage = () => {
    const user = useSelector((state) => state.user);
    const [shifts, setShifts] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
    });

    const [formData, setFormData] = useState({
        shiftType: 'morning',
        date: new Date().toISOString().split('T')[0],
        startTime: '06:00',
        endTime: '14:00',
        maxStaff: 10,
        notes: '',
    });

    const [assignData, setAssignData] = useState({
        userId: '',
        role: 'WAITER',
    });

    const shiftTypes = [
        { value: 'morning', label: 'Ca Sáng', start: '06:00', end: '14:00' },
        { value: 'afternoon', label: 'Ca Chiều', start: '14:00', end: '22:00' },
        { value: 'evening', label: 'Ca Tối', start: '22:00', end: '06:00' },
    ];

    // Fetch shifts
    const fetchShifts = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.get_shifts_by_date,
                params: dateRange,
            });

            if (response.data.success) {
                setShifts(response.data.data);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch employees
    const fetchEmployees = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.get_all_employees,
                params: { employeeStatus: 'active' },
            });

            if (response.data.success) {
                setEmployees(response.data.data);
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    useEffect(() => {
        fetchShifts();
        fetchEmployees();
    }, [dateRange]);

    // Handle shift type change
    const handleShiftTypeChange = (value) => {
        const shift = shiftTypes.find((s) => s.value === value);
        setFormData((prev) => ({
            ...prev,
            shiftType: value,
            startTime: shift.start,
            endTime: shift.end,
        }));
    };

    // Create shift
    const handleCreateShift = async (e) => {
        e.preventDefault();

        try {
            const response = await Axios({
                ...SummaryApi.create_shift,
                data: formData,
            });

            if (response.data.success) {
                successAlert(response.data.message);
                setIsCreateModalOpen(false);
                setFormData({
                    shiftType: 'morning',
                    date: new Date().toISOString().split('T')[0],
                    startTime: '06:00',
                    endTime: '14:00',
                    maxStaff: 10,
                    notes: '',
                });
                fetchShifts();
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    // Assign staff to shift
    const handleAssignStaff = async (e) => {
        e.preventDefault();

        try {
            const response = await Axios({
                ...SummaryApi.assign_staff_to_shift,
                data: {
                    shiftId: selectedShift._id,
                    ...assignData,
                },
            });

            if (response.data.success) {
                successAlert(response.data.message);
                setIsAssignModalOpen(false);
                setAssignData({ userId: '', role: 'WAITER' });
                fetchShifts();
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    // Delete shift
    const handleDeleteShift = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa ca làm việc này?')) {
            return;
        }

        try {
            const response = await Axios({
                ...SummaryApi.delete_shift,
                url: SummaryApi.delete_shift.url.replace(':id', id),
            });

            if (response.data.success) {
                successAlert(response.data.message);
                fetchShifts();
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
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
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-2xl font-bold">
                            Quản lý Ca làm việc
                        </CardTitle>
                        <Dialog
                            open={isCreateModalOpen}
                            onOpenChange={setIsCreateModalOpen}
                        >
                            <DialogTrigger asChild>
                                <Button className="bg-foreground">
                                    <FaPlus className="mr-2" /> Tạo ca làm
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        Tạo ca làm việc mới
                                    </DialogTitle>
                                </DialogHeader>
                                <form
                                    onSubmit={handleCreateShift}
                                    className="space-y-4"
                                >
                                    <div>
                                        <Label>Loại ca *</Label>
                                        <Select
                                            value={formData.shiftType}
                                            onValueChange={
                                                handleShiftTypeChange
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {shiftTypes.map((shift) => (
                                                    <SelectItem
                                                        key={shift.value}
                                                        value={shift.value}
                                                    >
                                                        {shift.label} (
                                                        {shift.start} -{' '}
                                                        {shift.end})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Ngày *</Label>
                                        <Input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    date: e.target.value,
                                                }))
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Giờ bắt đầu</Label>
                                            <Input
                                                type="time"
                                                value={formData.startTime}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        startTime:
                                                            e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label>Giờ kết thúc</Label>
                                            <Input
                                                type="time"
                                                value={formData.endTime}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        endTime: e.target.value,
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Số nhân viên tối đa</Label>
                                        <Input
                                            type="number"
                                            value={formData.maxStaff}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    maxStaff: parseInt(
                                                        e.target.value
                                                    ),
                                                }))
                                            }
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Ghi chú</Label>
                                        <Input
                                            value={formData.notes}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    notes: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setIsCreateModalOpen(false)
                                            }
                                        >
                                            Hủy
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-foreground"
                                        >
                                            Tạo ca làm
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Date Range Filter */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <Label>Từ ngày</Label>
                            <Input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) =>
                                    setDateRange((prev) => ({
                                        ...prev,
                                        startDate: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <Label>Đến ngày</Label>
                            <Input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) =>
                                    setDateRange((prev) => ({
                                        ...prev,
                                        endDate: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    {/* Shifts List */}
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loading />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {shifts.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    Không có ca làm việc nào
                                </p>
                            ) : (
                                shifts.map((shift) => (
                                    <Card key={shift._id}>
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="font-semibold text-lg capitalize">
                                                            Ca {shift.shiftType}
                                                        </h3>
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatDate(
                                                                shift.date
                                                            )}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {shift.startTime} -{' '}
                                                            {shift.endTime}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span>
                                                            Nhân viên:{' '}
                                                            {
                                                                shift
                                                                    .assignedStaff
                                                                    .length
                                                            }
                                                            /{shift.maxStaff}
                                                        </span>
                                                    </div>
                                                    {shift.assignedStaff
                                                        .length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {shift.assignedStaff.map(
                                                                (staff) => {
                                                                    if (
                                                                        !staff.userId
                                                                    )
                                                                        return null;
                                                                    return (
                                                                        <span
                                                                            key={
                                                                                staff
                                                                                    .userId
                                                                                    ._id
                                                                            }
                                                                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                                                        >
                                                                            {
                                                                                staff
                                                                                    .userId
                                                                                    .name
                                                                            }{' '}
                                                                            (
                                                                            {
                                                                                staff.role
                                                                            }
                                                                            )
                                                                        </span>
                                                                    );
                                                                }
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedShift(
                                                                shift
                                                            );
                                                            setIsAssignModalOpen(
                                                                true
                                                            );
                                                        }}
                                                    >
                                                        <FaUserPlus />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() =>
                                                            handleDeleteShift(
                                                                shift._id
                                                            )
                                                        }
                                                    >
                                                        <FaTrash />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Assign Staff Modal */}
            <Dialog
                open={isAssignModalOpen}
                onOpenChange={setIsAssignModalOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Phân công nhân viên</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAssignStaff} className="space-y-4">
                        <div>
                            <Label>Nhân viên *</Label>
                            <Select
                                value={assignData.userId}
                                onValueChange={(value) =>
                                    setAssignData((prev) => ({
                                        ...prev,
                                        userId: value,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn nhân viên" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((emp) => (
                                        <SelectItem
                                            key={emp._id}
                                            value={emp._id}
                                        >
                                            {emp.name} - {emp.role}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Vai trò trong ca</Label>
                            <Select
                                value={assignData.role}
                                onValueChange={(value) =>
                                    setAssignData((prev) => ({
                                        ...prev,
                                        role: value,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MANAGER">
                                        MANAGER
                                    </SelectItem>
                                    <SelectItem value="WAITER">
                                        WAITER
                                    </SelectItem>
                                    <SelectItem value="CHEF">CHEF</SelectItem>
                                    <SelectItem value="CASHIER">
                                        CASHIER
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAssignModalOpen(false)}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" className="bg-foreground">
                                Phân công
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ShiftManagementPage;
