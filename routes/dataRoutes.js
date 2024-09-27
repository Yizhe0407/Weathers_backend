// routes/dataRoutes.js
import express from 'express';
import { data } from '../controllers/dataController.js';

const router = express.Router();

router.get('/data', data);

export default router;