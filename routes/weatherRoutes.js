// routes/weatherRoutes.js
import express from 'express';
import { weather, add, del } from '../controllers/weatherController.js';

const router = express.Router();

router.post('/weather', weather);
router.post('/add', add);
router.post('/del', del);   

export default router;