import React, { useState } from 'react';
import { useEffect } from 'react';
import UploadCategoryModel from '../components/UploadCategoryModel';
import SummaryApi from '../common/SummaryApi';
import Loading from './../components/Loading';
import NoData from '../components/NoData';
import Axios from '../utils/Axios';
import EditCategory from '../components/EditCategoryModel';
import ConfirmBox from '../components/ConfirmBox';
import AxiosToastError from '../utils/AxiosToastError';
import successAlert from '../utils/successAlert';
import ViewImage from '../components/ViewImage';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import GlareHover from '@/components/GlareHover';
import { Button } from '@/components/ui/button';

const CategoryPage = () => {
    const [openUploadCaregory, setOpenUploadCaregory] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [openEdit, setOpenEdit] = useState(false);
    const [editData, setEditData] = useState({
        name: '',
        image: '',
    });

    const [openConfirmBoxDelete, setOpenConfirmBoxDelete] = useState(false);
    const [deleteCategory, setDeleteCategory] = useState({
        _id: '',
    });
    const [imageURL, setImageURL] = useState('');

    const fetchCategory = async () => {
        const accessToken = localStorage.getItem('accesstoken');
        if (!accessToken) return;

        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.get_category,
            });

            const { data: responseData } = response;

            if (responseData.success) {
                setData(responseData.data);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategory();
    }, []);

    const handleDeleteCategory = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.delete_category,
                data: deleteCategory,
            });

            const { data: responseData } = response;

            if (responseData.success) {
                successAlert(responseData.message);
                fetchCategory();
                setOpenConfirmBoxDelete(false);
            }
        } catch (error) {
            AxiosToastError(error);
        }
    };

    return (
        <section className="container mx-auto grid gap-2 z-10">
            <Card className="py-6 flex-row justify-between gap-6 border-gray-600 border-2">
                <CardHeader>
                    <CardTitle className="text-lg text-highlight font-bold uppercase">
                        Danh mục
                    </CardTitle>
                    <CardDescription>
                        Quản lý thông tin danh mục
                    </CardDescription>
                </CardHeader>

                <CardFooter>
                    <GlareHover
                        background="transparent"
                        glareOpacity={0.3}
                        glareAngle={-30}
                        glareSize={300}
                        transitionDuration={800}
                        playOnce={false}
                    >
                        <Button
                            onClick={() => setOpenUploadCaregory(true)}
                            className="bg-foreground"
                        >
                            Thêm Mới
                        </Button>
                    </GlareHover>
                </CardFooter>
            </Card>

            {/* Category Grid */}
            {!data[0] && !loading && <NoData message="Chưa có danh mục nào" />}

            {loading && <Loading />}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2 py-2">
                {data.map((category, index) => (
                    <div
                        key={category._id || index}
                        className="block rounded-[28px] liquid-glass border border-input p-2"
                    >
                        <div>
                            <Card className="bg-input hover:bg-transparent rounded-3xl transition-all duration-300 overflow-hidden group relative">
                                {/* Glow effect on hover */}
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-lime-300/20 to-lime-300/10 opacity-0 group-hover:opacity-100 transition-opacity
                            duration-500 pointer-events-none"
                                />

                                {/* Border glow */}
                                <div
                                    className="absolute inset-0 rounded-3xl border transition-all duration-500 border-transparent
                                group-hover:border-lime-300/70 group-hover:shadow-[0_0_15px_rgba(132,204,22,0.3)]"
                                />

                                <div className="relative w-full h-full overflow-hidden">
                                    <img
                                        src={category.image}
                                        alt={category.name}
                                        className="w-full h-32 sm:h-44 object-cover bg-background transition-transform duration-700 cursor-pointer group-hover:scale-100 group-hover:opacity-80"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src =
                                                '/placeholder-category.jpg';
                                        }}
                                        onClick={() =>
                                            setImageURL(category.image)
                                        }
                                    />
                                </div>

                                <CardContent className="px-2 py-3 sm:px-3 sm:py-4 flex flex-col gap-3">
                                    <h3 className="text-center font-semibold transition-colors duration-300 line-clamp-2 h-fit w-full">
                                        {category.name}
                                    </h3>

                                    <div className="flex w-full items-center justify-center gap-2">
                                        <GlareHover
                                            background="transparent"
                                            glareOpacity={0.3}
                                            glareAngle={-30}
                                            glareSize={300}
                                            transitionDuration={800}
                                            playOnce={false}
                                            className="flex-1"
                                        >
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenEdit(true);
                                                    setEditData(category);
                                                }}
                                                className="bg-muted-foreground hover:bg-muted-foreground w-full"
                                            >
                                                Sửa
                                            </Button>
                                        </GlareHover>
                                        <GlareHover
                                            background="transparent"
                                            glareOpacity={0.3}
                                            glareAngle={-30}
                                            glareSize={300}
                                            transitionDuration={800}
                                            playOnce={false}
                                            className="flex-1"
                                        >
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenConfirmBoxDelete(
                                                        true
                                                    );
                                                    setDeleteCategory(category);
                                                }}
                                                className="bg-foreground w-full"
                                            >
                                                Xóa
                                            </Button>
                                        </GlareHover>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ))}
            </div>

            {openUploadCaregory && (
                <UploadCategoryModel
                    fetchData={fetchCategory}
                    close={() => setOpenUploadCaregory(false)}
                />
            )}

            {openEdit && (
                <EditCategory
                    fetchData={fetchCategory}
                    data={editData}
                    close={() => setOpenEdit(false)}
                />
            )}

            {openConfirmBoxDelete && (
                <ConfirmBox
                    confirm={handleDeleteCategory}
                    cancel={() => setOpenConfirmBoxDelete(false)}
                    close={() => setOpenConfirmBoxDelete(false)}
                    title="Xóa danh mục"
                    message="Bạn có chắc chắn muốn xóa danh mục này?"
                    confirmText="Xóa"
                    cancelText="Hủy"
                />
            )}

            {imageURL && (
                <ViewImage url={imageURL} close={() => setImageURL('')} />
            )}
        </section>
    );
};

export default CategoryPage;
