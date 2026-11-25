import { z } from "zod";
import { jobSearchIndex, profileSearchIndex } from "../config/searchIndexes";
import { JobPost } from "../models/jobPost.model";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ErrorHandling.ts/APIError";
import { ApiResponse } from "../utils/ErrorHandling.ts/APIResponse";
import { asyncHandler } from "../utils/ErrorHandling.ts/asyncHandler";

const pageSize = 20;
const lastPage = 1_000;
const searchQuery = z.object({
  searchString: z.string().trim().min(1).max(200),
  page: z.string().regex(/^[1-9]\d*$/).transform(Number)
    .pipe(z.number().int().min(1).max(lastPage)).default(1),
});

function parseSearchQuery(query: unknown) {
  const parsed = searchQuery.safeParse(query);
  if (!parsed.success) {
    throw new ApiError(400, "Enter a search term of 1–200 characters and a valid page.");
  }
  return parsed.data;
}

function searchResponse<T>(rows: T[], page: number) {
  return new ApiResponse(200, {
    results: rows.slice(0, pageSize),
    hasNextPage: rows.length > pageSize && page < lastPage,
  });
}

export const searchUsers = asyncHandler(async (req, res) => {
  const { searchString, page } = parseSearchQuery(req.query);
  const rows = await User.aggregate([
    {
      $search: {
        index: profileSearchIndex.name,
        compound: {
          should: [
            { text: { query: searchString, path: ["name", "description"] } },
            { autocomplete: { query: searchString, path: "name" } },
          ],
          minimumShouldMatch: 1,
        },
        sort: { score: { $meta: "searchScore" }, _id: 1 },
      },
    },
    { $skip: (page - 1) * pageSize },
    { $limit: pageSize + 1 },
    { $project: { name: 1, headline: 1, description: 1 } },
  ]);
  res.json(searchResponse(rows, page));
});

export const searchJobs = asyncHandler(async (req, res) => {
  const { searchString, page } = parseSearchQuery(req.query);
  const rows = await JobPost.aggregate([
    {
      $search: {
        index: jobSearchIndex.name,
        compound: {
          must: [{ text: { query: searchString, path: ["title", "description"] } }],
          filter: [{ equals: { path: "isOpen", value: true } }],
        },
      },
    },
    // Check the current document as Atlas Search indexes update asynchronously.
    { $match: { isOpen: true } },
    { $skip: (page - 1) * pageSize },
    { $limit: pageSize + 1 },
    { $project: { title: 1, company_name: 1, location: 1, description: 1 } },
  ]);
  res.json(searchResponse(rows, page));
});
