import cors from 'cors';
import express from 'express';
import { ConnectDB } from './config/db.js';
import dataRoute from './routes/dataRoutes.js';
import weatherRoute from './routes/weatherRoutes.js';

const app = express();
app.use(cors({
    origin: '*', // 設置允許的來源
    methods: ['GET', 'POST'], // 設置允許的方法
    credentials: true, // 如果需要使用 cookie 驗證
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