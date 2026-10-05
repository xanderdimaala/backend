import * as bookController from '../controllers/bookControllers.js';
import express from "express";

const bookRoutes = express.Routers = express.Router();

bookRoutes.get('/', bookController.fetchAllBooks);

export default bookRoutes;


