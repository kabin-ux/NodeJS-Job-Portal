import express from 'express';
import connectToDB from './database/db.js';
import { PORT } from './config.js';
import userRouter from './routes/userRoute.js';
import jobRouter from './routes/jobRoute.js';
import testRouter from './routes/testRoute.js';

const app = express();

app.use(express.json());

connectToDB();

app.use('/api/user', userRouter);

app.use('/api/jobs', jobRouter);

app.use('/api/test', testRouter);

app.listen(PORT || 3000, () => console.log(`Server running on port ${PORT}`));

