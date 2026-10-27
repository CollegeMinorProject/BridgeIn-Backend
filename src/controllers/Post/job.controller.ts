import { JobPost } from '../../models/jobPost.model';
import { asyncHandler } from '../../utils/ErrorHandling.ts/asyncHandler';

export const createJob = asyncHandler(async (req: any, res: any) => {
  const { title, description, requirements } = req.body;
  const job = await JobPost.create({ 
    title, 
    description, 
    requirements, 
    employer_id: req.user?._id 
  });
  
  return res.status(201).json({
    statusCode: 201,
    success: true,
    data: job,
    message: "Job posted successfully"
  });
});

export const getJobs = asyncHandler(async (req: any, res: any) => {
  const jobs = await JobPost.find({ isOpen: true }).sort({ createdAt: -1 }).populate('employer_id', 'name email');
  return res.status(200).json({
    statusCode: 200,
    success: true,
    data: jobs,
    message: "Jobs retrieved"
  });
});

export const updateJobStatus = asyncHandler(async (req: any, res: any) => {
  const { jobId } = req.params;
  const { isOpen } = req.body;
  
  const job = await JobPost.findOneAndUpdate(
    { _id: jobId, employer_id: req.user?._id },
    { isOpen },
    { new: true }
  );

  if (!job) {
    return res.status(404).json({
      statusCode: 404,
      success: false,
      message: "Job not found or unauthorized"
    });
  }

  return res.status(200).json({
    statusCode: 200,
    success: true,
    data: job,
    message: "Job updated"
  });
});

export const deleteJob = asyncHandler(async (req: any, res: any) => {
  const { jobId } = req.params;
  const job = await JobPost.findOneAndDelete({ _id: jobId, employer_id: req.user?._id });
  
  if (!job) {
    return res.status(404).json({
      statusCode: 404,
      success: false,
      message: "Job not found or unauthorized"
    });
  }

  return res.status(200).json({
    statusCode: 200,
    success: true,
    data: null,
    message: "Job deleted"
  });
});