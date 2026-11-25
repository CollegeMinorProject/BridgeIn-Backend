import mongoose from "mongoose";

export const MOCK_INTERVIEW_STATUSES = ["in_progress", "completed"] as const;
export type MockInterviewStatus = (typeof MOCK_INTERVIEW_STATUSES)[number];

const mockInterviewSchema = new mongoose.Schema(
  {
    candidate_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // optional, used to tailor the questions to a specific job listing
    job_post_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobPost",
      default: null,
    },
    target_role: {
      type: String,
      required: [true, "Target role is required"],
      trim: true,
      maxlength: [150, "Target role cannot exceed 150 characters"],
    },
    // adjusted dynamically as the candidate answers
    current_difficulty: {
      type: Number,
      validate: Number.isInteger,
      default: 1,
      min: [1, "Difficulty cannot be below 1"],
      max: [10, "Difficulty cannot exceed 10"],
    },
    weakness_areas: {
      type: [{ type: String, trim: true }],
      default: [],
    },
    overall_score: {
      type: Number,
      default: null,
      validate: (value: number | null) => value === null || Number.isInteger(value),
      min: [0, "Score cannot be below 0"],
      max: [100, "Score cannot exceed 100"],
    },
    status: {
      type: String,
      enum: {
        values: MOCK_INTERVIEW_STATUSES,
        message: "{VALUE} is not a valid mock interview status",
      },
      default: "in_progress",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
);

// candidate history, newest first
mockInterviewSchema.index({ candidate_id: 1, startedAt: -1 });

export type MockInterviewDocument = mongoose.Document &
  mongoose.InferSchemaType<typeof mockInterviewSchema>;
export type IMockInterview = mongoose.InferSchemaType<
  typeof mockInterviewSchema
>;
export const MockInterview = mongoose.model(
  "MockInterview",
  mockInterviewSchema,
);
