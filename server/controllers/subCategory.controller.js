import SubCategoryModel from "../models/subCategory.model.js"

export const addSubCategoryController = async (req, res) => {
    try {
        const { name, image, category } = req.body

        if (!name || !image || !category[0]) {
            return res.status(400).json({
                message: "Enter required fields",
                error: true,
                success: false
            })
        }

        const addSubCategory = new SubCategoryModel({
            name,
            image,
            category
        })

        const saveCategory = await addSubCategory.save()

        if (!saveCategory) {
            return res.status(500).json({
                message: "Not created",
                error: true,
                success: false
            })
        }

        return res.json({
            message: "Add sub category successfully",
            data: saveCategory,
            error: false,
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const getSubCategoryController = async (req, res) => {
    try {
        const data = await SubCategoryModel.find().sort({ createdAt: -1 }).populate('category')

        return res.json({
            message: 'Sub Category Data',
            data: data,
            error: false,
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const updateSubCategoryController = async (req, res) => {
    try {
        const { _id, name, image, category } = req.body

        const check = await SubCategoryModel.findById(_id)

        if (!check) {
            return res.status(400).json({
                message: 'Check your _id',
                error: true,
                success: false
            })
        }

        const update = await SubCategoryModel.findByIdAndUpdate(
            _id,
            { name, image, category },
            { new: true }
        );

        return res.json({
            message: 'Update Sub Category Successfully',
            error: false,
            success: true,
            data: update
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const deleteSubCategoryController = async (req, res) => {
    try {
        const { _id } = req.body

        const deleteSubCategory = await SubCategoryModel.findByIdAndDelete(_id)

        return res.json({
            message: 'Delete category successfully',
            data: deleteSubCategory,
            error: false,
            success: true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}