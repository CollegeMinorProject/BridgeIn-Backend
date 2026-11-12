import { JobPost } from '../../models/jobPost.model';
import { asyncHandler } from '../../utils/ErrorHandling.ts/asyncHandler';
import { ApiError } from '../../utils/ErrorHandling.ts/APIError';
import { ApiResponse } from '../../utils/ErrorHandling.ts/APIResponse';
// IMPORT CLOUDINARY UTILITY (Adjust the path according to your project structure)
import { uploadOnCloudinary } from '../../utils/cloudinary'; 
import '../../models/user.model'; 

export const createJob = asyncHandler(async (req: any, res: any) => {
  const { title, description, requirements } = req.body;
  
  // Check if image is provided via Multer
  const imageLocalPath = req.file?.path;
  if (!imageLocalPath) {
    throw new ApiError(400, "Job image is mandatory");
  }

  // Upload the image to Cloudinary
  const imageUploadResult = await uploadOnCloudinary(imageLocalPath);
  if (!imageUploadResult) {
    throw new ApiError(500, "Failed to upload image to Cloudinary");
  }

  // Create the job post with the Cloudinary image URL
  const job = await JobPost.create({ 
    title, 
    description, 
    requirements, 
    image: imageUploadResult, 
    employer_id: req.user?._id 
  });
  
  // Return standard ApiResponse format
  return res.status(201).json(new ApiResponse(201, job, "Job posted successfully"));
});

export const getJobs = asyncHandler(async (_req: any, res: any) => {
  const jobs = await JobPost.find({ isOpen: true })
    .sort({ createdAt: -1 })
    .populate('employer_id', 'name email');
    
  return res.status(200).json(new ApiResponse(200, jobs, "Jobs retrieved"));
});

export const updateJobStatus = asyncHandler(async (req: any, res: any) => {
  const { jobId } = req.params;
  const { isOpen } = req.body;
  
  const job = await JobPost.findOneAndUpdate(
    { _id: jobId, employer_id: req.user?._id },
    { isOpen },
    { new: true }
  );

  // Throw ApiError instead of hardcoded 404
  if (!job) {
    throw new ApiError(404, "Job not found or unauthorized");
  }

  return res.status(200).json(new ApiResponse(200, job, "Job updated"));
});

export const deleteJob = asyncHandler(async (req: any, res: any) => {
  const { jobId } = req.params;
  const job = await JobPost.findOneAndDelete({ _id: jobId, employer_id: req.user?._id });
  
  // throw ApiError instead of hardcoded 404
  if (!job) {
    throw new ApiError(404, "Job not found or unauthorized");
  }

  return res.status(200).json(new ApiResponse(200, null, "Job deleted"));
});