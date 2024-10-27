import cors from 'cors';
import express from 'express';
import { ConnectDB } from './config/db.js';
import dataRoute from './routes/dataRoutes.js';
import weatherRoute from './routes/weatherRoutes.js';

const app = express();
app.use(cors({
    origin: "*", // 加上你的 Vercel 項目域名
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 連接到資料庫
const LoadDB = async () => {
    await ConnectDB();
};
LoadDB();

app.use('/api', weatherRoute );
app.use('/api', dataRoute);

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});