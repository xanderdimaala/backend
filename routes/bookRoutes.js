import * as bookController from '../controllers/bookControllers.js';
import express from "express";

const bookRoutes  = express.Router();

bookRoutes.get ('/all', bookController.fetchAllbooks);
bookRoutes.post ('/', bookController.fetchAllbooks);

export default bookRoutes;


