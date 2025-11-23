import { Router } from "express";
import auth from "../middleware/auth.js";
import {
    createTableController,
    getAllTablesController,
    getTableByIdController,
    updateTableController,
    deleteTableController,
    updateTableStatusController,
    getAvailableTablesController
} from "../controllers/table.controller.js";

const tableRouter = Router();

tableRouter.post('/create', auth, createTableController);
tableRouter.get('/get-all', getAllTablesController);
tableRouter.get('/get/:id', getTableByIdController);
tableRouter.put('/update', auth, updateTableController);
tableRouter.delete('/delete', auth, deleteTableController);
tableRouter.patch('/update-status', auth, updateTableStatusController);
tableRouter.get('/available', getAvailableTablesController);

export default tableRouter;
