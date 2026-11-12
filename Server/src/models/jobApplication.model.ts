const mongoose = require("mongoose");
const { Schema } = mongoose;

const jobApplicationSchema = new Schema(
  {
    job_post_id: {
      type: Schema.Types.ObjectId,
      ref: "JobPost",
      required: true,
      index: true,
    },
    candidate_id: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    resume_id: {
      type: Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ["applied", "interviewing", "rejected", "hired"],
        message: "{VALUE} is not a valid application status",
      },
      default: "applied",
      index: true,
    },
  },
  {
    timestamps: { createdAt: "appliedAt", updatedAt: "updatedAt" },
  },
);
jobApplicationSchema.index(
  { job_post_id: 1, candidate_id: 1 },
  { unique: true },
);

module.exports = mongoose.model("JobApplication", jobApplicationSchema);
