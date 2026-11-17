import { Router } from 'express';
import { createJob, getJobs, updateJobStatus, deleteJob } from '../controllers/Post/job.controller';
import { isLoggedInMiddleWare } from '../middleware/isLoggedIn'; 
// IMPORT MULTER MIDDLEWARE (Adjust the path according to your project structure)
import { upload } from '../middleware/multer.middleware';

const router = Router();

// Apply the auth middleware to all job routes since they require req.user
router.use(isLoggedInMiddleWare); 

router.route('/')
  // Point 7: Add multer middleware to handle single image upload
  .post(upload.single('image'), createJob)     // POST /api/jobs
  .get(getJobs);                               // GET /api/jobs

router.route('/:jobId')
  .patch(updateJobStatus) // PATCH /api/jobs/:jobId
  .delete(deleteJob);     // DELETE /api/jobs/:jobId

export default router;