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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import Loading from '../components/Loading';

const EmployeeManagementPage = () => {
    const user = useSelector((state) => state.user);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterRole, setFilterRole] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        mobile: '',
        role: 'WAITER',
        position: '',
        hireDate: new Date().toISOString().split('T')[0],
    });

    const roles = ['ADMIN', 'MANAGER', 'WAITER', 'CHEF', 'CASHIER'];

    // Fetch employees
    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.get_all_employees,
                params: {
                    role: filterRole === 'ALL' ? '' : filterRole,
                    employeeStatus: filterStatus === 'ALL' ? '' : filterStatus,
                    search: searchTerm,
                },
            });

            if (response.data.success) {
                setEmployees(response.data.data);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, [filterRole, filterStatus, searchTerm]);

    // Handle form change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSelectChange = (name, value) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Create employee
    const handleCreateEmployee = async (e) => {
        e.preventDefault();

        try {
            const response = await Axios({
                ...SummaryApi.create_employee,
                data: formData,
            });

            if (response.data.success) {
                successAlert(response.data.message);
                setIsAddModalOpen(false);
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    mobile: '',
                    role: 'WAITER',
                    position: '',
                    hireDate: new Date().toISOString().split('T')[0],
                });
                fetchEmployees();
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    // Update employee
    const handleUpdateEmployee = async (e) => {
        e.preventDefault();

        try {
            const response = await Axios({
                ...SummaryApi.update_employee,
                url: SummaryApi.update_employee.url.replace(
                    ':id',
                    selectedEmployee._id
                ),
                data: formData,
            });

            if (response.data.success) {
                successAlert(response.data.message);
                setIsEditModalOpen(false);
                setSelectedEmployee(null);
                fetchEmployees();
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    // Delete employee
    const handleDeleteEmployee = async (id) => {
        if (
            !window.confirm('Bạn có chắc chắn muốn vô hiệu hóa nhân viên này?')
        ) {
            return;
        }

        try {
            const response = await Axios({
                ...SummaryApi.delete_employee,
                url: SummaryApi.delete_employee.url.replace(':id', id),
            });

            if (response.data.success) {
                successAlert(response.data.message);
                fetchEmployees();
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    // Open edit modal
    const openEditModal = (employee) => {
        setSelectedEmployee(employee);
        setFormData({
            name: employee.name,
            email: employee.email,
            mobile: employee.mobile || '',
            role: employee.role,
            position: employee.position || '',
            hireDate: employee.hireDate
                ? new Date(employee.hireDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
        });
        setIsEditModalOpen(true);
    };

    // Check if user has permission
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
                            Quản lý Nhân viên
                        </CardTitle>
                        <Dialog
                            open={isAddModalOpen}
                            onOpenChange={setIsAddModalOpen}
                        >
                            <DialogTrigger asChild>
                                <Button className="bg-foreground">
                                    <FaPlus className="mr-2" /> Thêm nhân viên
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>
                                        Thêm nhân viên mới
                                    </DialogTitle>
                                </DialogHeader>
                                <form
                                    onSubmit={handleCreateEmployee}
                                    className="space-y-4"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="name">
                                                Họ và tên *
                                            </Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="email">
                                                Email *
                                            </Label>
                                            <Input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="password">
                                                Mật khẩu *
                                            </Label>
                                            <Input
                                                type="password"
                                                id="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="mobile">
                                                Số điện thoại
                                            </Label>
                                            <Input
                                                type="tel"
                                                id="mobile"
                                                name="mobile"
                                                value={formData.mobile}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="role">
                                                Vai trò *
                                            </Label>
                                            <Select
                                                value={formData.role}
                                                onValueChange={(value) =>
                                                    handleSelectChange(
                                                        'role',
                                                        value
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem
                                                            key={role}
                                                            value={role}
                                                        >
                                                            {role}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="position">
                                                Vị trí
                                            </Label>
                                            <Input
                                                id="position"
                                                name="position"
                                                value={formData.position}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="hireDate">
                                                Ngày vào làm
                                            </Label>
                                            <Input
                                                type="date"
                                                id="hireDate"
                                                name="hireDate"
                                                value={formData.hireDate}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setIsAddModalOpen(false)
                                            }
                                        >
                                            Hủy
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-foreground"
                                        >
                                            Tạo nhân viên
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <Label>Tìm kiếm</Label>
                            <Input
                                placeholder="Tên, email, mã nhân viên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Vai trò</Label>
                            <Select
                                value={filterRole}
                                onValueChange={setFilterRole}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tất cả vai trò" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tất cả</SelectItem>
                                    {roles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {role}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Trạng thái</Label>
                            <Select
                                value={filterStatus}
                                onValueChange={setFilterStatus}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tất cả trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tất cả</SelectItem>
                                    <SelectItem value="active">
                                        Đang làm việc
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        Nghỉ việc
                                    </SelectItem>
                                    <SelectItem value="on_leave">
                                        Nghỉ phép
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loading />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã NV</TableHead>
                                    <TableHead>Tên</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Vai trò</TableHead>
                                    <TableHead>Vị trí</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center"
                                        >
                                            Không có nhân viên nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((employee) => (
                                        <TableRow key={employee._id}>
                                            <TableCell>
                                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                    {employee.employeeId || '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {employee.name}
                                            </TableCell>
                                            <TableCell>
                                                {employee.email}
                                            </TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                    {employee.role}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {employee.position || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`px-2 py-1 rounded text-xs ${
                                                        employee.employeeStatus ===
                                                        'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {employee.employeeStatus ===
                                                    'active'
                                                        ? 'Đang làm'
                                                        : 'Nghỉ việc'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            openEditModal(
                                                                employee
                                                            )
                                                        }
                                                    >
                                                        <FaEdit />
                                                    </Button>
                                                    {user?.role === 'ADMIN' && (
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() =>
                                                                handleDeleteEmployee(
                                                                    employee._id
                                                                )
                                                            }
                                                        >
                                                            <FaTrash />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa nhân viên</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateEmployee} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="edit-name">Họ và tên *</Label>
                                <Input
                                    id="edit-name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-mobile">
                                    Số điện thoại
                                </Label>
                                <Input
                                    type="tel"
                                    id="edit-mobile"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-role">Vai trò *</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) =>
                                        handleSelectChange('role', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role} value={role}>
                                                {role}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="edit-position">Vị trí</Label>
                                <Input
                                    id="edit-position"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" className="bg-foreground">
                                Cập nhật
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EmployeeManagementPage;
