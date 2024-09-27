// routes/weatherRoutes.js
import express from 'express';
import { weather,createUser ,add } from '../controllers/weatherController.js';

const router = express.Router();

router.post('/weather', weather);
router.post('/createUser', createUser);
router.post('/add', add);

export default router;