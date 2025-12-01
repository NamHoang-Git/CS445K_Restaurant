import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiLogOut, FiMinus, FiPlus } from 'react-icons/fi';
import { handleAddItemCart } from '../store/cartProduct';

const TableMenuPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user);
    const cartItems = useSelector((state) => state.cartItem.cart);

    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCart, setShowCart] = useState(false);
    const [tableInfo, setTableInfo] = useState(null);

    // Check if user is a table account
    useEffect(() => {
        if (!user || user.role !== 'TABLE') {
            toast.error('Vui lòng quét mã QR tại bàn để đặt món');
            navigate('/');
            return;
        }

        // Get table session info
        fetchTableSession();
    }, [user, navigate]);

    const fetchTableSession = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.getTableSession,
            });
            if (response.data.success) {
                setTableInfo(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching table session:', error);
        }
    };

    // Fetch categories
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.get_category,
            });
            if (response.data.success) {
                setCategories(response.data.data);
                if (response.data.data.length > 0) {
                    setSelectedCategory(response.data.data[0]._id);
                }
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Không thể tải danh mục');
        } finally {
            setLoading(false);
        }
    };

    // Fetch products by category
    const fetchProducts = useCallback(async () => {
        try {
            console.log('Fetching products for category:', selectedCategory);
            const response = await Axios({
                ...SummaryApi.get_product_by_category,
                data: {
                    id: selectedCategory, // Changed from categoryId to id
                },
            });
            console.log('Products response:', response.data);
            if (response.data.success) {
                console.log('Products data:', response.data.data);
                setProducts(response.data.data);
            } else {
                console.log(
                    'API returned success=false:',
                    response.data.message
                );
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            console.error('Error response:', error.response?.data);
        }
    }, [selectedCategory]);

    useEffect(() => {
        if (selectedCategory) {
            fetchProducts();
        }
    }, [selectedCategory, fetchProducts]);

    const handleAddToCart = async (product) => {
        try {
            const response = await Axios({
                ...SummaryApi.add_to_cart,
                data: {
                    productId: product._id,
                },
            });
            if (response.data.success) {
                toast.success('Đã thêm vào giỏ hàng');
                // Refresh cart
                fetchCart();
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Không thể thêm vào giỏ hàng');
        }
    };

    const fetchCart = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.get_cart_item,
            });
            if (response.data.success) {
                dispatch(handleAddItemCart(response.data.data));
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
    };

    const handleUpdateQuantity = async (cartItemId, newQty) => {
        if (newQty < 1) return;
        try {
            const response = await Axios({
                ...SummaryApi.update_cart_item_qty,
                data: {
                    _id: cartItemId,
                    qty: newQty,
                },
            });
            if (response.data.success) {
                fetchCart();
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            toast.error('Không thể cập nhật số lượng');
        }
    };

    const handleRemoveItem = async (cartItemId) => {
        try {
            const response = await Axios({
                ...SummaryApi.delete_cart_item,
                data: {
                    _id: cartItemId,
                },
            });
            if (response.data.success) {
                toast.success('Đã xóa khỏi giỏ hàng');
                fetchCart();
            }
        } catch (error) {
            console.error('Error removing item:', error);
            toast.error('Không thể xóa món');
        }
    };

    const handlePlaceOrder = async () => {
        if (cartItems.length === 0) {
            toast.error('Giỏ hàng trống');
            return;
        }

        try {
            // Calculate totals
            const subTotalAmt = cartItems.reduce(
                (sum, item) =>
                    sum + (item.productId?.price || 0) * item.quantity,
                0
            );
            const totalAmt = subTotalAmt; // For dine-in, no shipping cost

            const response = await Axios({
                ...SummaryApi.cash_on_delivery_order,
                data: {
                    list_items: cartItems,
                    subTotalAmt: subTotalAmt,
                    totalAmt: totalAmt,
                    orderType: 'dine_in',
                    tableNumber: tableInfo?.tableNumber,
                },
            });
            if (response.data.success) {
                toast.success('Đã gọi món thành công!');
                setShowCart(false);
                fetchCart();
            }
        } catch (error) {
            console.error('Error placing order:', error);
            toast.error('Không thể gọi món');
        }
    };

    const handleLogout = async () => {
        try {
            await Axios({
                ...SummaryApi.logoutTable,
            });
            toast.success('Đã đăng xuất');
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const totalAmount = cartItems.reduce(
        (sum, item) => sum + (item.productId?.price || 0) * item.quantity,
        0
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 sticky top-0 z-40 shadow-lg">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {tableInfo?.tableNumber || 'Bàn'}
                        </h1>
                        <p className="text-sm opacity-90">
                            {tableInfo?.tableLocation || 'Nhà hàng lẩu'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowCart(true)}
                            className="relative bg-white text-orange-500 p-3 rounded-full hover:bg-orange-50 transition-colors"
                        >
                            <FiShoppingCart size={24} />
                            {cartItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                                    {cartItems.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-white text-orange-500 p-3 rounded-full hover:bg-orange-50 transition-colors"
                        >
                            <FiLogOut size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="bg-white shadow-sm sticky top-[72px] z-30">
                <div className="max-w-7xl mx-auto overflow-x-auto">
                    <div className="flex gap-2 p-4">
                        {categories.map((category) => (
                            <button
                                key={category._id}
                                onClick={() =>
                                    setSelectedCategory(category._id)
                                }
                                className={`px-6 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                                    selectedCategory === category._id
                                        ? 'bg-orange-500 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                        <div
                            key={product._id}
                            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="aspect-square bg-gray-100">
                                {product.image && product.image[0] && (
                                    <img
                                        src={product.image[0]}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <div className="p-3">
                                <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                                    {product.name}
                                </h3>
                                <p className="text-orange-500 font-bold text-lg mb-2">
                                    {product.price?.toLocaleString('vi-VN')}đ
                                </p>
                                <button
                                    onClick={() => handleAddToCart(product)}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg transition-colors"
                                >
                                    Thêm
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart Sidebar */}
            {showCart && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-50"
                    onClick={() => setShowCart(false)}
                >
                    <div
                        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col h-full">
                            {/* Cart Header */}
                            <div className="bg-orange-500 text-white p-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold">
                                        Giỏ hàng
                                    </h2>
                                    <button
                                        onClick={() => setShowCart(false)}
                                        className="text-2xl"
                                    >
                                        &times;
                                    </button>
                                </div>
                            </div>

                            {/* Cart Items */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {cartItems.length === 0 ? (
                                    <p className="text-center text-gray-500 mt-8">
                                        Giỏ hàng trống
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {cartItems.map((item) => (
                                            <div
                                                key={item._id}
                                                className="flex gap-3 bg-gray-50 p-3 rounded-lg"
                                            >
                                                <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.productId
                                                        ?.image?.[0] && (
                                                        <img
                                                            src={
                                                                item.productId
                                                                    .image[0]
                                                            }
                                                            alt={
                                                                item.productId
                                                                    .name
                                                            }
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-800">
                                                        {item.productId?.name}
                                                    </h3>
                                                    <p className="text-orange-500 font-bold">
                                                        {item.productId?.price?.toLocaleString(
                                                            'vi-VN'
                                                        )}
                                                        đ
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <button
                                                            onClick={() =>
                                                                handleUpdateQuantity(
                                                                    item._id,
                                                                    item.quantity -
                                                                        1
                                                                )
                                                            }
                                                            className="bg-gray-200 p-1 rounded"
                                                        >
                                                            <FiMinus />
                                                        </button>
                                                        <span className="font-semibold">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                handleUpdateQuantity(
                                                                    item._id,
                                                                    item.quantity +
                                                                        1
                                                                )
                                                            }
                                                            className="bg-gray-200 p-1 rounded"
                                                        >
                                                            <FiPlus />
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleRemoveItem(
                                                                    item._id
                                                                )
                                                            }
                                                            className="ml-auto text-red-500 text-sm"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Cart Footer */}
                            {cartItems.length > 0 && (
                                <div className="border-t p-4 space-y-4">
                                    <div className="flex justify-between items-center text-lg font-bold">
                                        <span>Tổng cộng:</span>
                                        <span className="text-orange-500">
                                            {totalAmount.toLocaleString(
                                                'vi-VN'
                                            )}
                                            đ
                                        </span>
                                    </div>
                                    <button
                                        onClick={handlePlaceOrder}
                                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors"
                                    >
                                        Gọi món
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableMenuPage;
