import { Request, Response } from "express";
import { ApiResponse } from "../../utils/ErrorHandling.ts/APIResponse";
import { asyncHandler } from "../../utils/ErrorHandling.ts/asyncHandler";
import { createPostSchema } from "./post.schema";
import { ApiError } from "../../utils/ErrorHandling.ts/APIError";
import { createPostService } from "../../services/Post.Services";

//create post
export const createPost = asyncHandler(async (req: Request, res: Response) => {
  let file = req.file?.path;
  let result = createPostSchema.safeParse(req.body);
  if (!result.success) {
    throw new ApiError(403, "Invalid data");
  }
  try {
    await createPostService(result.data.text, req.user, file);
  } catch (error) {
    throw new ApiError(500, "Something went wrong");
  }
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { messsage: "Post created Sucessfully" },
        "reaching",
      ),
    );
});
//delete post
//update post
//like dislike post
//get like details
//comment on post
//get comment in bunch
//delete comment
