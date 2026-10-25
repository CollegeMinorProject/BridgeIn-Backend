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
      // Conditional requirement: 'text' is required only if 'attachmentUrl' is missing
      required: function () {
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
  },
);

messageSchema.index({ conversation_id: 1, createdAt: -1 });
messageSchema.post("save", async function (doc, next) {
  try {
    const Conversation = mongoose.model("Conversation");
    const previewText = doc.text ? doc.text : "📎 Attachment";

    await Conversation.findByIdAndUpdate(doc.conversation_id, {
      last_message_text: previewText.slice(0, 500),
      last_message_at: doc.createdAt,
    });
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Message", messageSchema);
