import { Router } from 'express';
import { createJob, getJobs, updateJobStatus, deleteJob } from '../controllers/Post/job.controller';
import { isLoggedInMiddleWare } from '../middleware/isLoggedIn'; 

const router = Router();

// Apply the auth middleware to all job routes since they require req.user
router.use(isLoggedInMiddleWare); 

router.route('/')
  .post(createJob)     // POST /api/jobs
  .get(getJobs);       // GET /api/jobs

router.route('/:jobId')
  .patch(updateJobStatus) // PATCH /api/jobs/:jobId
  .delete(deleteJob);     // DELETE /api/jobs/:jobId

export default router;