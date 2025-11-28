import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    FaSearch,
    FaFileInvoice,
    FaPrint,
    FaFilePdf,
    FaFileExcel,
    FaFilter,
    FaSort,
    FaSortUp,
    FaSortDown,
    FaTimesCircle,
} from 'react-icons/fa';
import { DisplayPriceInVND } from '../utils/DisplayPriceInVND';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import StatusBadge from '../components/StatusBadge';
import { fetchAllOrders, updateOrderStatus } from '../store/orderSlice';
import ViewImage from '../components/ViewImage';
import ConfirmBox from '../components/ConfirmBox';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@radix-ui/react-label';

const BillPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { allOrders: orders = [], loading } = useSelector(
        (state) => state.orders
    );
    const user = useSelector((state) => state.user);
    const isAdmin = user?.role === 'ADMIN';
    // Allow ADMIN, MANAGER, WAITER, CASHIER to access
    const canAccessBills = ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER'].includes(
        user?.role
    );

    // State for search and filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterParams, setFilterParams] = useState({
        status: '',
        startDate: '',
        endDate: '',
    });
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [dateError, setDateError] = useState('');

    const [imageURL, setImageURL] = useState('');
    const [openUpdateStatus, setOpenUpdateStatus] = useState(false);
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    const [sortConfig, setSortConfig] = useState({
        key: 'createdAt',
        direction: 'desc',
    });

    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 10,
    });

    // Gọi API chỉ khi filterParams thay đổi
    useEffect(() => {
        const loadOrders = async () => {
            const accessToken = localStorage.getItem('accesstoken');
            if (!accessToken || !canAccessBills) {
                navigate('/dashboard/profile');
                return;
            }

            try {
                await dispatch(fetchAllOrders(filterParams)).unwrap();
            } catch (error) {
                if (error?.response?.status !== 401) {
                    toast.error(error || 'Có lỗi xảy ra khi tải đơn hàng');
                }
            }
        };

        loadOrders();
    }, [dispatch, canAccessBills, navigate, filterParams]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        // Tạo đối tượng params mới để kiểm tra
        const newParams = {
            ...filterParams,
            [name]: value,
        };

        // Kiểm tra nếu cả hai ngày đều có giá trị
        if (newParams.startDate && newParams.endDate) {
            const startDate = new Date(newParams.startDate);
            const endDate = new Date(newParams.endDate);

            if (startDate > endDate) {
                setDateError(
                    'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc'
                );
                return; // Không cập nhật params nếu ngày không hợp lệ
            }
        }

        // Nếu kiểm tra hợp lệ, xóa thông báo lỗi và cập nhật params
        setDateError('');
        setFilterParams(newParams);
        // Reset về trang đầu tiên khi thay đổi bộ lọc
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    // Reset all filters and search
    const resetFilters = () => {
        setFilterParams({
            status: '',
            startDate: '',
            endDate: '',
        });
        setSearchTerm('');
        setDateError(''); // Xóa thông báo lỗi khi reset
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction:
                prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    // Reset to first page when search term changes
    useEffect(() => {
        if (searchTerm) {
            setPagination((prev) => ({
                ...prev,
                currentPage: 1,
            }));
        }
    }, [searchTerm]);

    // Apply filters and search
    useEffect(() => {
        try {
            let result = [...orders];

            // Apply status filter
            if (filterParams.status) {
                result = result.filter(
                    (order) => order.payment_status === filterParams.status
                );
            }

            // Apply date range filter
            if (filterParams.startDate) {
                const startDate = new Date(filterParams.startDate);
                result = result.filter(
                    (order) => new Date(order.createdAt) >= startDate
                );
            }

            if (filterParams.endDate) {
                const endDate = new Date(filterParams.endDate);
                endDate.setHours(23, 59, 59, 999); // End of the day
                result = result.filter(
                    (order) => new Date(order.createdAt) <= endDate
                );
            }

            // Apply search term
            if (searchTerm.trim()) {
                const searchLower = searchTerm.trim().toLowerCase();
                result = result.filter((order) => {
                    const searchFields = [
                        order.orderId,
                        order.userId?.name,
                        order.userId?.email,
                        // Check both user mobile and delivery address mobile
                        order.userId?.mobile,
                        order.delivery_address?.mobile,
                        // Check phone number in different formats
                        order.userId?.mobile?.replace(/\s+/g, ''), // Remove spaces
                        order.delivery_address?.mobile?.replace(/\s+/g, ''), // Remove spaces
                        order.payment_status,
                        order.delivery_address?.city,
                        order.delivery_address?.district,
                        order.delivery_address?.ward,
                        order.delivery_address?.address,
                        // Search in product details if available
                        ...(order.products?.flatMap((product) => [
                            product.name,
                            product.sku,
                            product.brand,
                            product.category?.name,
                        ]) || []),
                        // Fallback to product_details if products array is not available
                        order.product_details?.name,
                        order.product_details?.brand,
                        order.product_details?.category,
                    ].filter(Boolean);

                    return searchFields.some((field) =>
                        String(field).toLowerCase().includes(searchLower)
                    );
                });
            }

            setFilteredOrders(result);
        } catch (error) {
            console.error('Error filtering orders:', error);
            setFilteredOrders(orders);
        }
    }, [orders, searchTerm, filterParams]);

    // Apply sorting
    const filteredAndSortedOrders = useMemo(() => {
        const result = [...filteredOrders];

        if (sortConfig.key) {
            result.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key.includes('.')) {
                    const keys = sortConfig.key.split('.');
                    aValue = keys.reduce((obj, key) => obj?.[key], a);
                    bValue = keys.reduce((obj, key) => obj?.[key], b);
                }

                // Handle date comparisons
                if (sortConfig.key === 'createdAt') {
                    const dateA = new Date(aValue);
                    const dateB = new Date(bValue);
                    return sortConfig.direction === 'asc'
                        ? dateA - dateB
                        : dateB - dateA;
                }

                // Handle string and number comparisons
                if (aValue == null) aValue = '';
                if (bValue == null) bValue = '';

                if (aValue < bValue)
                    return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue)
                    return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [filteredOrders, sortConfig]);

    // Phân trang
    const indexOfLastOrder = pagination.currentPage * pagination.pageSize;
    const indexOfFirstOrder = indexOfLastOrder - pagination.pageSize;
    const currentOrders = filteredAndSortedOrders.slice(
        indexOfFirstOrder,
        indexOfLastOrder
    );
    const totalPages = Math.ceil(
        filteredAndSortedOrders.length / pagination.pageSize
    );

    const paginate = (pageNumber) =>
        setPagination((prev) => ({ ...prev, currentPage: pageNumber }));

    const handlePageSizeChange = (e) => {
        setPagination({
            currentPage: 1,
            pageSize: Number(e.target.value),
        });
    };

    const PaginationControls = () => (
        <div className="flex items-center sm:flex-row flex-col justify-between mt-4 gap-3 text-foreground">
            <div className="flex items-center sm:flex-row flex-col space-x-2 gap-2">
                <span className="text-sm text-center">
                    Hiển thị{' '}
                    <span className="font-semibold text-highlight">
                        {indexOfFirstOrder + 1}
                    </span>{' '}
                    đến{' '}
                    <span className="font-semibold text-highlight">
                        {Math.min(
                            indexOfLastOrder,
                            filteredAndSortedOrders.length
                        )}
                    </span>{' '}
                    trong tổng số{' '}
                    <span className="font-semibold text-highlight">
                        {filteredAndSortedOrders.length}
                    </span>{' '}
                    đơn hàng
                </span>

                <select
                    value={pagination.pageSize}
                    onChange={handlePageSizeChange}
                    className="text-sm h-8 border-foreground border bg-transparent
                px-3 py-1 rounded-md"
                >
                    {[5, 10, 25, 50].map((size) => (
                        <option key={size} value={size}>
                            {size} dòng/trang
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex space-x-1">
                <button
                    onClick={() => paginate(1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 rounded-md border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    «
                </button>
                <button
                    onClick={() => paginate(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 rounded-md border border-gray-300 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((pageNum) => {
                        return (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            pageNum === pagination.currentPage ||
                            (pageNum === 2 && pagination.currentPage > 3) ||
                            (pageNum === totalPages - 1 &&
                                pagination.currentPage < totalPages - 2)
                        );
                    })
                    .map((pageNum, idx, arr) => {
                        if (idx > 0 && pageNum - arr[idx - 1] > 1) {
                            return (
                                <React.Fragment key={pageNum}>
                                    <span className="px-3 py-1 text-gray-500">
                                        ...
                                    </span>
                                    <button
                                        onClick={() => paginate(pageNum)}
                                        className={`px-3 py-1 rounded-md border text-sm font-medium ${
                                            pagination.currentPage === pageNum
                                                ? 'bg-gray-700 text-white border-lime-300'
                                                : 'bg-white text-black border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                </React.Fragment>
                            );
                        }
                        return (
                            <button
                                key={pageNum}
                                onClick={() => paginate(pageNum)}
                                className={`px-3 py-1 rounded-md border text-sm font-medium ${
                                    pagination.currentPage === pageNum
                                        ? 'bg-gray-700 text-white border-lime-300'
                                        : 'bg-white text-black border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}

                <button
                    onClick={() => paginate(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === totalPages}
                    className="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ›
                </button>
                <button
                    onClick={() => paginate(totalPages)}
                    disabled={pagination.currentPage === totalPages}
                    className="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    »
                </button>
            </div>
        </div>
    );

    const { totalRevenue, orderCount } = useMemo(() => {
        return filteredAndSortedOrders.reduce(
            (acc, order) => ({
                totalRevenue: acc.totalRevenue + (order.totalAmt || 0),
                orderCount: acc.orderCount + 1,
            }),
            { totalRevenue: 0, orderCount: 0 }
        );
    }, [filteredAndSortedOrders]);

    const exportToExcel = () => {
        const data = filteredAndSortedOrders.map((order) => ({
            'Mã hóa đơn': order.orderId,
            'Ngày tạo': format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', {
                locale: vi,
            }),
            'Khách hàng': order.userId?.name || 'Khách vãng lai',
            'Sản phẩm': order.product_details?.name || '',
            'Số lượng': order.quantity,
            'Tổng tiền': order.totalAmt,
            'Trạng thái thanh toán': order.payment_status || 'Chưa xác định',
            'Địa chỉ giao hàng': order.delivery_address?.address || '',
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Danh sách hóa đơn');
        XLSX.writeFile(
            wb,
            `danh-sach-hoa-don-${new Date().toISOString().split('T')[0]}.xlsx`
        );
    };

    const exportToPDF = async () => {
        try {
            if (!window.jsPDF) throw new Error('Thư viện PDF chưa tải');

            const { jsPDF } = window.jsPDF;
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
            });

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text('DANH SÁCH HÓA ĐƠN', 148, 15, { align: 'center' });

            doc.setFontSize(10);
            doc.text(
                `Ngày xuất: ${format(new Date(), 'dd/MM/yyyy HH:mm', {
                    locale: vi,
                })}`,
                14,
                25
            );

            const headers = [
                'Mã Đơn',
                'Ngày tạo',
                'Khách hàng',
                'Sản phẩm',
                'SL',
                'Tổng tiền',
                'Trạng thái',
            ];
            const data = filteredAndSortedOrders.map((order) => [
                order.orderId,
                format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: vi }),
                order.userId?.name || 'Khách vãng lai',
                (order.product_details?.name?.substring(0, 20) || '') +
                    (order.product_details?.name?.length > 20 ? '...' : ''),
                order.quantity,
                DisplayPriceInVND(order.totalAmt || 0),
                order.payment_status || 'Chưa xác định',
            ]);

            doc.autoTable({
                head: [headers],
                body: data,
                startY: 30,
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                headStyles: {
                    fillColor: [41, 128, 185],
                    textColor: [255, 255, 255],
                },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 25 },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 'auto' },
                    4: { cellWidth: 10, halign: 'center' },
                    5: { cellWidth: 25, halign: 'right' },
                    6: { cellWidth: 30 },
                },
            });

            const finalY = doc.lastAutoTable.finalY;
            doc.text(`Tổng số hóa đơn: ${orderCount}`, 14, finalY + 10);
            doc.text(
                `Tổng doanh thu: ${DisplayPriceInVND(totalRevenue)}`,
                14,
                finalY + 20
            );

            doc.save(
                `danh-sach-hoa-don-${format(
                    new Date(),
                    'yyyy-MM-dd-HH-mm-ss'
                )}.pdf`
            );
            toast.success('Xuất PDF thành công!');
        } catch (error) {
            toast.error(`Xuất PDF thất bại: ${error.message}`);
        }
    };

    const handleOpenConfirmBox = (orderId) => {
        setSelectedOrderId(orderId);
        setOpenUpdateStatus(true);
    };

    const handleUpdateStatus = async (
        orderId,
        status = 'Đã thanh toán',
        cancelReason = ''
    ) => {
        try {
            const updateData = { orderId, status };
            if (status === 'Đã hủy' && cancelReason)
                updateData.cancelReason = cancelReason;

            await dispatch(updateOrderStatus(updateData)).unwrap();
            await dispatch(fetchAllOrders(filterParams)).unwrap();

            toast.success(
                status === 'Đã hủy'
                    ? 'Hủy đơn hàng thành công!'
                    : 'Cập nhật trạng thái thành công!'
            );
            setOpenUpdateStatus(false);
            setOpenCancelDialog(false);
            setCancelReason('');
            setSelectedOrderId(null);
        } catch (error) {
            toast.error(error?.message || 'Cập nhật thất bại');
        }
    };

    const printBill = (order) => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html><head><title>Hóa đơn ${order.orderId}</title>
            <style>
                body { font-family: Arial; font-size: 12px; padding: 20px; }
                .header, .info, .table, .signature { margin-bottom: 20px; }
                .title { font-size: 18px; font-weight: bold; text-align: center; }
                .info-row { display: flex; margin-bottom: 5px; }
                .info-label { font-weight: bold; width: 120px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background: #f2f2f2; }
                .text-right { text-align: right; }
            </style>
            </head><body onload="window.print()">
                <div class="title">HÓA ĐƠN BÁN HÀNG</div>
                <div style="text-align:center">Ngày: ${format(
                    new Date(order.createdAt),
                    'dd/MM/yyyy HH:mm',
                    { locale: vi }
                )}</div>
                <div class="info">
                    <div class="info-row"><div class="info-label">Mã HD:</div><div>${
                        order.orderId
                    }</div></div>
                    <div class="info-row"><div class="info-label">Khách:</div><div>${
                        order.userId?.name || 'Khách vãng lai'
                    }<br>${order.userId?.mobile || ''}</div></div>
                    <div class="info-row"><div class="info-label">Địa chỉ:</div><div>${
                        order.delivery_address?.city || ''
                    }</div></div>
                </div>
                <table>
                    <tr><th>STT</th><th>Sản phẩm</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th></tr>
                    <tr>
                        <td>1</td>
                        <td>${order.product_details?.name || ''}</td>
                        <td>${DisplayPriceInVND(
                            (order.totalAmt || 0) / (order.quantity || 1)
                        )}</td>
                        <td>${order.quantity || 1}</td>
                        <td class="text-right">${DisplayPriceInVND(
                            order.totalAmt || 0
                        )}</td>
                    </tr>
                    <tfoot><tr><td colspan="4" class="text-right"><strong>Tổng:</strong></td><td class="text-right"><strong>${DisplayPriceInVND(
                        order.totalAmt || 0
                    )}</strong></td></tr></tfoot>
                </table>
                <div class="signature" style="display:flex; justify-content: space-between; margin-top: 50px;">
                    <div>Người lập<br>(Ký, ghi rõ họ tên)</div>
                    <div>Khách hàng<br>(Ký, ghi rõ họ tên)</div>
                </div>
            </body></html>
        `);
        printWindow.document.close();
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort className="ml-1" />;
        return sortConfig.direction === 'asc' ? (
            <FaSortUp className="ml-1" />
        ) : (
            <FaSortDown className="ml-1" />
        );
    };

    const statusOptions = [
        { value: '', label: 'Tất cả' },
        { value: 'Đang chờ thanh toán', label: 'Đang chờ thanh toán' },
        { value: 'Đã thanh toán', label: 'Đã thanh toán' },
    ];

    return (
        <section className="container mx-auto grid gap-2 z-10">
            <Card className="py-6 flex-row justify-between gap-6 border-card-foreground">
                <CardHeader>
                    <CardTitle className="text-lg text-highlight font-bold uppercase">
                        Quản lý đơn hàng
                    </CardTitle>
                    <CardDescription>Quản lý đơn hàng hệ thống</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-2">
                <div className="liquid-glass rounded-lg shadow-md p-3 flex items-center gap-4">
                    <div className="p-3 rounded-full border-[3px] liquid-glass text-highlight_2">
                        <FaFileInvoice className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold">Tổng số hóa đơn</p>
                        <p className="text-xl font-bold">{orderCount}</p>
                    </div>
                </div>
                <div className="liquid-glass rounded-lg shadow-md p-3 flex items-center gap-4">
                    <div className="p-3 rounded-full border-[3px] liquid-glass text-highlight_2">
                        <FaFileInvoice className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold">Tổng doanh thu</p>
                        <p className="text-xl font-bold">
                            {DisplayPriceInVND(totalRevenue)}
                        </p>
                    </div>
                </div>
                <div className="liquid-glass rounded-lg shadow-md p-3 flex items-center gap-4">
                    <div className="p-3 rounded-full border-[3px] liquid-glass text-highlight_2">
                        <FaFilter className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold">Đang hiển thị</p>
                        <p className="text-xl font-bold">
                            {Math.min(
                                indexOfFirstOrder + 1,
                                filteredAndSortedOrders.length
                            )}{' '}
                            -{' '}
                            {Math.min(
                                indexOfLastOrder,
                                filteredAndSortedOrders.length
                            )}{' '}
                            / {orders.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Bộ lọc */}
            <div className="rounded-lg border-2 liquid-glass px-4 py-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                    <div className="space-y-2">
                        <Label className="block font-medium">Tìm kiếm</Label>
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Tìm kiếm..."
                                className="w-full pl-10 h-12 text-sm placeholder:text-foreground border-foreground"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="block font-medium">Trạng thái</Label>
                        <select
                            name="status"
                            className="text-sm h-12 w-full border-foreground border bg-transparent
                    px-3 py-1 rounded-md cursor-pointer"
                            value={filterParams.status}
                            onChange={handleFilterChange}
                        >
                            {statusOptions.map((opt) => (
                                <option
                                    key={opt.value}
                                    value={opt.value}
                                    className="text-foreground bg-background"
                                >
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="block font-medium mb-1">
                            Từ ngày
                        </Label>
                        <div className="relative">
                            <input
                                type="date"
                                name="startDate"
                                className="text-sm h-12 w-full border-foreground border bg-transparent
                            px-3 py-1 rounded-md pr-8 appearance-none" // Thêm appearance-none
                                value={filterParams.startDate}
                                onChange={handleFilterChange}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg
                                    className="w-5 h-5 text-foreground"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="block font-medium mb-1">
                            Đến ngày
                        </Label>
                        <div className="relative">
                            <input
                                type="date"
                                name="endDate"
                                className={`w-full h-12 border ${
                                    dateError
                                        ? 'border-red-500'
                                        : 'border-foreground'
                                } bg-transparent px-3 py-1 rounded-md pr-8 appearance-none text-sm`}
                                value={filterParams.endDate}
                                onChange={handleFilterChange}
                                min={filterParams.startDate}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg
                                    className="w-5 h-5 text-foreground"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                        </div>
                        {dateError && (
                            <p className="mt-1 text-sm text-red-500">
                                {dateError}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end mt-4 gap-2">
                    <button
                        onClick={resetFilters}
                        className="px-4 h-9 font-medium liquid-glass rounded-lg text-sm"
                    >
                        Đặt lại
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="flex items-center px-4 h-9 text-white bg-green-600/80 rounded-lg hover:bg-green-700"
                    >
                        <FaFileExcel className="mr-2" /> Xuất Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="flex items-center px-4 h-9 text-white bg-red-600/80 rounded-lg hover:bg-red-700"
                    >
                        <FaFilePdf className="mr-2" /> Xuất PDF
                    </button>
                </div>
            </div>

            {/* Bảng */}
            <div className="rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto scrollbarCustom">
                    <table className="liquid-glass w-full min-w-[1024px] divide-y-4">
                        <thead className="text-lime-300">
                            <tr>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase">
                                    <div className="flex items-center justify-center">
                                        Mã Đơn
                                        <button
                                            onClick={() =>
                                                handleSort('orderId')
                                            }
                                            className="ml-1"
                                        >
                                            {renderSortIcon('orderId')}
                                        </button>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                                    Khách hàng
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase">
                                    Sản phẩm
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase">
                                    <div className="flex items-center justify-center">
                                        Tổng tiền
                                        <button
                                            onClick={() =>
                                                handleSort('totalAmt')
                                            }
                                            className="ml-1"
                                        >
                                            {renderSortIcon('totalAmt')}
                                        </button>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase">
                                    Trạng thái
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase">
                                    <div className="flex items-center justify-center">
                                        Ngày tạo
                                        <button
                                            onClick={() =>
                                                handleSort('createdAt')
                                            }
                                            className="ml-1"
                                        >
                                            {renderSortIcon('createdAt')}
                                        </button>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-white">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={7} className="px-6 py-4">
                                            <div className="animate-pulse flex space-x-4">
                                                <div className="flex-1 space-y-3 py-1">
                                                    <div className="h-4 bg-gray-200 rounded"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : currentOrders.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-6 py-4 text-center"
                                    >
                                        Không tìm thấy đơn hàng
                                    </td>
                                </tr>
                            ) : (
                                currentOrders.map((order) => (
                                    <tr
                                        key={order._id}
                                        className="hover:bg-black/60 text-xs sm:text-sm"
                                    >
                                        <td className="px-4 py-4 font-medium text-center text-rose-500">
                                            {order.orderId}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div>
                                                <div className="font-medium text-rose-500">
                                                    {order.userId?.name ||
                                                        'Khách vãng lai'}
                                                </div>
                                                <p>{order.userId?.email}</p>
                                                <p>
                                                    {
                                                        order.delivery_address
                                                            ?.mobile
                                                    }
                                                </p>
                                                <p>
                                                    {
                                                        order.delivery_address
                                                            ?.city
                                                    }
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 flex items-center gap-3 max-w-[250px]">
                                            <img
                                                src={
                                                    order.product_details
                                                        ?.image?.[0] ||
                                                    '/placeholder.jpg'
                                                }
                                                alt=""
                                                className="w-12 h-12 border border-lime-300 object-cover rounded shadow cursor-pointer"
                                                onClick={() =>
                                                    setImageURL(
                                                        order.product_details
                                                            ?.image?.[0]
                                                    )
                                                }
                                                onError={(e) =>
                                                    (e.target.src =
                                                        '/placeholder.jpg')
                                                }
                                            />
                                            <div>
                                                <p
                                                    className="line-clamp-2"
                                                    title={
                                                        order.product_details
                                                            ?.name
                                                    }
                                                >
                                                    {order.product_details
                                                        ?.name || 'N/A'}
                                                </p>
                                                <p className="text-rose-400 font-bold">
                                                    x{order.quantity}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center font-medium">
                                            {DisplayPriceInVND(
                                                order.totalAmt || 0
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <StatusBadge
                                                status={order.payment_status}
                                            />
                                        </td>
                                        <td className="px-4 py-4 text-center font-medium">
                                            {format(
                                                new Date(order.createdAt),
                                                'dd/MM/yyyy HH:mm',
                                                { locale: vi }
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-center space-y-2 space-x-2">
                                            {[
                                                'Đang chờ thanh toán',
                                                'Chờ thanh toán',
                                            ].includes(
                                                order.payment_status
                                            ) && (
                                                <button
                                                    onClick={() =>
                                                        handleOpenConfirmBox(
                                                            order._id
                                                        )
                                                    }
                                                    className="text-white bg-black/50 border-2 border-lime-300 p-2 rounded-md"
                                                >
                                                    Cập nhật
                                                </button>
                                            )}
                                            <button
                                                onClick={() => printBill(order)}
                                                className="text-rose-600 p-2 liquid-glass rounded-md hover:opacity-80"
                                            >
                                                <FaPrint />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredAndSortedOrders.length > 0 && (
                <div className="px-6 py-4 border-t-4 border-secondary-200">
                    <PaginationControls />
                </div>
            )}

            {imageURL && (
                <ViewImage url={imageURL} close={() => setImageURL('')} />
            )}
            {openUpdateStatus && (
                <ConfirmBox
                    open={openUpdateStatus}
                    close={() => {
                        setOpenUpdateStatus(false);
                        setSelectedOrderId(null);
                    }}
                    confirm={() => handleUpdateStatus(selectedOrderId)}
                    title="Xác nhận cập nhật"
                    message="Cập nhật trạng thái thành Đã thanh toán?"
                    confirmText="Xác nhận"
                    cancelText="Hủy"
                />
            )}
        </section>
    );
};

export default BillPage;
