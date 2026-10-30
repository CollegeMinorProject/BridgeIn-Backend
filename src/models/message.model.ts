const mongoose = require("mongoose");
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
      ref: "user", // Matches your 'user' entity name
      required: true,
      index: true,
    },
    text: {
      type: String,
      trim: true,
      // Explicitly define the 'this' context and the boolean return type
      required: function (this: { attachmentUrl?: string | null }): boolean {
        return !this.attachmentUrl;
      },
    },
    attachmentUrl: {
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
    timestamps: true,
  }
);

messageSchema.index({ conversation_id: 1, createdAt: -1 });

// Added explicit types for 'doc' and 'next'
messageSchema.post("save", async function (doc: any, next: (err?: Error) => void) {
  try {
    const Conversation = mongoose.model("Conversation");
    const previewText = doc.text ? doc.text : "📎 Attachment";

    await Conversation.findByIdAndUpdate(doc.conversation_id, {
      last_message_text: previewText.slice(0, 500),
      last_message_at: doc.createdAt,
    });
    next();
  } catch (error) {
    next(error as Error);
  }
});

module.exports = mongoose.model("Message", messageSchema);