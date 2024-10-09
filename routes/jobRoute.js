import { Router } from "express";
import { verifyJWT, verifyRole } from "../middlewares/auth.js";
import { createJob, deleteJob, getAllJobs, getJobStats, updateJobs } from "../controllers/jobController.js";

const jobRouter = Router();

// Only Admins can create a job
jobRouter.post('/create-job', verifyJWT, verifyRole('admin'), createJob );

// Both Users and Admins can view jobs
jobRouter.get('/get-job', verifyJWT, verifyRole('user', 'admin'), getAllJobs );

// Only Admins can update a job
jobRouter.put('/update-job/:id', verifyJWT, verifyRole('admin'), updateJobs );

// Only Admins can delete a job
jobRouter.delete('/delete-job/:id', verifyJWT, verifyRole('admin'), deleteJob );

// Both Users and Admins can view job stats
jobRouter.get('/job-stats/', verifyJWT, verifyRole('user', 'admin'), getJobStats );


export default jobRouter;