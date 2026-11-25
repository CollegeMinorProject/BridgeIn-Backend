import mongoose from "mongoose"
const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    conversation_id: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      trim: true,
      // Explicitly define the 'this' context and the boolean return type
      required: function (this: { attachment_url?: string | null }): boolean {
        return !this.attachment_url;
      },
    },
    attachment_url: {
      type: String,
      trim: true,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true, // Useful for counting unread messages quickly
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

messageSchema.index({ conversation_id: 1, createdAt: -1 });
messageSchema.index({ conversation_id: 1, _id: -1 });

messageSchema.post("save", async function (doc) {
  const preview = doc.text || "📎 Attachment";
  await mongoose.model("Conversation").updateOne(
    { _id: doc.conversation_id, last_message_at: { $lte: doc.createdAt } },
    { $set: { last_message_text: preview.slice(0, 500), last_message_at: doc.createdAt } },
  );
});

export default mongoose.model("Message", messageSchema);
