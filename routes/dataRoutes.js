// routes/dataRoutes.js
import express from 'express';
import { data } from '../controllers/dataController.js';    

const router = express.Router();

router.get('/data/:email', data);

export default router;