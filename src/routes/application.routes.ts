import { Router } from 'express';
import { updateApplicationStatus } from '../controllers/Post/application.controller';
import { isLoggedInMiddleWare } from '../middleware/isLoggedIn'; 

const router = Router();

// Apply auth middleware because only authorized users (Employers) can update status
router.use(isLoggedInMiddleWare); 

// Route: PATCH /api/applications/:applicationId/status
router.route('/:applicationId/status')
  .patch(updateApplicationStatus);

export default router;