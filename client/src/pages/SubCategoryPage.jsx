import React, { useState } from 'react';
import { useEffect } from 'react';
import { format } from 'date-fns';
import UploadSubCategoryModel from '../components/UploadSubCategoryModel';
import SummaryApi from '../common/SummaryApi';
import Axios from '../utils/Axios';
import AxiosToastError from '../utils/AxiosToastError';
import ViewImage from '../components/ViewImage';
import { LuPencil, LuTrash } from 'react-icons/lu';
import Loading from '../components/Loading';
import ConfirmBox from '../components/ConfirmBox';
import successAlert from '../utils/successAlert';
import EditSubCategoryModel from '@/components/EditSubCategoryModel';
import DynamicTable from '@/components/table/dynamic-table';

const SubCategoryPage = () => {
    const [openAddSubCategory, setOpenAddSubCategory] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [imageURL, setImageURL] = useState('');

    const [openEdit, setOpenEdit] = useState(false);
    const [editData, setEditData] = useState({
        _id: '',
        name: '',
        image: '',
    });

    const [openConfirmBoxDelete, setOpenConfirmBoxDelete] = useState(false);
    const [deleteSubCategory, setDeleteSubCategory] = useState({
        _id: '',
    });

    const fetchSubCategory = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.get_sub_category,
            });

            if (response.data.success) {
                const formattedData = response.data.data.map((item, index) => ({
                    id: index + 1,
                    _id: item._id,
                    name: item.name,
                    date: format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm'),
                    image: item.image || '',
                    category:
                        Array.isArray(item.category) && item.category.length > 0
                            ? item.category.map((cat) => cat.name).join(', ')
                            : 'Chưa có danh mục',
                    categoryData: item.category,
                }));
                setData(formattedData);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubCategory();
    }, []);

    const handleDeleteSubCategory = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.delete_sub_category,
                data: deleteSubCategory,
            });

            const { data: responseData } = response;

            if (responseData.success) {
                successAlert(responseData.message);
                fetchSubCategory();
                setOpenConfirmBoxDelete(false);
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    const columns = [
        { key: 'id', label: 'ID', type: 'number', sortable: true },
        { key: 'name', label: 'Tên', type: 'string', sortable: true },
        {
            key: 'date',
            label: 'Ngày tạo',
            type: 'string',
            sortable: true,
        },
        {
            key: 'image',
            label: 'Hình ảnh',
            type: 'string',
            sortable: false,
            format: (value, row) => {
                if (!row) return 'Không có';
                return row.image ? (
                    <img
                        src={row.image}
                        alt={row.name || 'Image'}
                        className="w-12 h-12 object-cover rounded hover:scale-105 cursor-pointer border border-muted-foreground/50"
                        onClick={() => setImageURL(row.image)}
                    />
                ) : (
                    'Không có'
                );
            },
        },
        {
            key: 'category',
            label: 'Danh mục',
            type: 'string',
            sortable: false,
            format: (value, row) => {
                if (
                    !row ||
                    !row.categoryData ||
                    !Array.isArray(row.categoryData) ||
                    row.categoryData.length === 0
                ) {
                    return (
                        <span className="text-muted-foreground text-sm">
                            Chưa có danh mục
                        </span>
                    );
                }
                return (
                    <div className="flex flex-wrap gap-1">
                        {row.categoryData.map((cat, index) => (
                            <span
                                key={cat._id || index}
                                className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200"
                            >
                                {cat.name}
                            </span>
                        ))}
                    </div>
                );
            },
        },
        {
            key: 'action',
            label: 'Thao tác',
            type: 'string',
            sortable: false,
            format: (value, row) =>
                row ? (
                    <div className="flex gap-2">
                        <button
                            className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenEdit(true);
                                setEditData(row);
                            }}
                        >
                            <LuPencil size={18} />
                        </button>
                        <button
                            className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenConfirmBoxDelete(true);
                                setDeleteSubCategory(row);
                            }}
                        >
                            <LuTrash size={18} />
                        </button>
                    </div>
                ) : null,
        },
    ];

    return (
        <section>
            <div
                className="p-2 mb-3 bg-slate-50 rounded shadow-md flex items-center
            justify-between gap-4"
            >
                <h2 className="font-bold">Sub Category</h2>
                <button
                    onClick={() => setOpenAddSubCategory(true)}
                    className="text-sm border border-green-400 hover:bg-green-200
                rounded py-1 px-6"
                >
                    Add
                </button>
            </div>

            <div className="overflow-auto w-full max-w-[95vw]">
                <DynamicTable
                    data={data}
                    columns={columns}
                    pageSize={5}
                    sortable={false}
                    searchable={false}
                    filterable={false}
                    groupable={false}
                />
            </div>

            {loading && <Loading />}

            {openAddSubCategory && (
                <UploadSubCategoryModel
                    close={() => setOpenAddSubCategory(false)}
                    fetchData={fetchSubCategory}
                />
            )}

            {imageURL && (
                <ViewImage url={imageURL} close={() => setImageURL('')} />
            )}

            {openEdit && (
                <EditSubCategoryModel
                    close={() => setOpenEdit(false)}
                    fetchData={fetchSubCategory}
                    data={editData}
                />
            )}

            {openConfirmBoxDelete && (
                <ConfirmBox
                    close={() => setOpenConfirmBoxDelete(false)}
                    cancel={() => setOpenConfirmBoxDelete(false)}
                    confirm={handleDeleteSubCategory}
                />
            )}
        </section>
    );
};

export default SubCategoryPage;
