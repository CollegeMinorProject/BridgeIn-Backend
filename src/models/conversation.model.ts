const mongoose = require("mongoose");
const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    participant1_id: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    participant2_id: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    last_message_text: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    last_message_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);
conversationSchema.index(
  { participant1_id: 1, participant2_id: 1 },
  { unique: true },
);
conversationSchema.pre("validate", function (next) {
  if (this.participant1_id && this.participant2_id) {
    const id1 = this.participant1_id.toString();
    const id2 = this.participant2_id.toString();

    if (id1 > id2) {
      const temp = this.participant1_id;
      this.participant1_id = this.participant2_id;
      this.participant2_id = temp;
    }
  }
  next();
});

module.exports = mongoose.model("Conversation", conversationSchema);
