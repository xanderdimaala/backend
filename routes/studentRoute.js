studentRoutes.studentController from '../controllers/studentController.js;
import express from "express";

studentRoutes = express.Routers = express.Router();

studentRoutes.get('/', studentController.fetchAllstudent);

export default studentRoutes;
