import cors from 'cors';
import express from 'express';
import weatherRoute from './routes/weatherRoutes.js';
import dataRoute from './routes/dataRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', weatherRoute);
app.use('/api', dataRoute);

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});