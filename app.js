import cors from 'cors';
import express from 'express';
import { ConnectDB } from './config/db.js';
import dataRoute from './routes/dataRoutes.js';
import weatherRoute from './routes/weatherRoutes.js';

const app = express();

const allowedOrigins = ['http://localhost:3001', 'https://skynet-mu.vercel.app'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    credentials: true,
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