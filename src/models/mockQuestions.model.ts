import mongoose from "mongoose";

const mockQuestionSchema = new mongoose.Schema(
  {
    mock_interview_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MockInterview",
      required: true,
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    // empty until the candidate answers
    candidate_answer: {
      type: String,
      default: "",
      trim: true,
    },
    // empty until the AI has evaluated the answer
    ai_feedback: {
      type: String,
      default: "",
      trim: true,
    },
    question_difficulty: {
      type: Number,
      required: true,
      min: [1, "Difficulty cannot be below 1"],
      max: [10, "Difficulty cannot exceed 10"],
    },
  },
  {
    timestamps: true,
  },
);
mockQuestionSchema.index({ mock_interview_id: 1, createdAt: 1 });
export type MockQuestionDocument = mongoose.Document &
  mongoose.InferSchemaType<typeof mockQuestionSchema>;
export type IMockQuestion = mongoose.InferSchemaType<typeof mockQuestionSchema>;
export const MockQuestion = mongoose.model("MockQuestion", mockQuestionSchema);
