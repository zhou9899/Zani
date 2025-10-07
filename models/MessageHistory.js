// models/MessageHistory.js
import mongoose from 'mongoose';

const messageHistorySchema = new mongoose.Schema({
  // Message identification
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Context information
  userNumber: {
    type: String,
    required: true,
    index: true
  },
  internalId: {
    type: String,
    required: true,
    index: true
  },
  chatId: {
    type: String,
    required: true,
    index: true
  },
  
  // Message content
  content: {
    type: String,
    required: true,
    trim: true
  },
  isBot: {
    type: Boolean,
    required: true,
    default: false
  },
  fromMe: {
    type: Boolean,
    required: true,
    default: false
  },
  
  // AI context
  aiContext: {
    intent: String,
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      default: 'neutral'
    },
    tokensUsed: Number,
    modelUsed: String,
    responseTime: Number
  },
  
  // WhatsApp metadata
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document', 'sticker', 'location'],
    default: 'text'
  },
  
  // Group chat info
  isGroup: {
    type: Boolean,
    default: false
  },
  groupId: String,
  
  // Context for conversation flow
  quotedMessage: {
    messageId: String,
    content: String
  },
  mentions: [String],
  
  // Timestamp for conversation context
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
  
}, {
  timestamps: true
});

// Compound indexes for common queries
messageHistorySchema.index({ userNumber: 1, timestamp: -1 });
messageHistorySchema.index({ chatId: 1, timestamp: -1 });
messageHistorySchema.index({ timestamp: -1 });
messageHistorySchema.index({ isBot: 1, timestamp: -1 });

// Static methods
messageHistorySchema.statics.getConversationContext = async function(chatId, limit = 10) {
  return await this.find({ chatId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('content isBot userNumber timestamp messageType')
    .lean();
};

messageHistorySchema.statics.getUserRecentMessages = async function(userNumber, limit = 15) {
  return await this.find({ userNumber })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('content timestamp chatId isBot')
    .lean();
};

messageHistorySchema.statics.getChatHistory = async function(chatId, hours = 24) {
  const timeThreshold = new Date(Date.now() - (hours * 60 * 60 * 1000));
  
  return await this.find({
    chatId,
    timestamp: { $gte: timeThreshold }
  })
  .sort({ timestamp: 1 })
  .select('content userNumber isBot timestamp')
  .lean();
};

messageHistorySchema.statics.isMessageRepeated = async function(userNumber, content, timeWindowMinutes = 2) {
  const timeThreshold = new Date(Date.now() - (timeWindowMinutes * 60 * 1000));
  
  const recentSimilar = await this.findOne({
    userNumber,
    content: { $regex: new RegExp(content.substring(0, 20), 'i') },
    timestamp: { $gte: timeThreshold }
  });
  
  return !!recentSimilar;
};

messageHistorySchema.statics.cleanOldMessages = async function(daysToKeep = 30) {
  const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
  
  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });
  
  console.log(`🧹 Cleaned ${result.deletedCount} messages older than ${daysToKeep} days`);
  return result.deletedCount;
};

// Instance method to format for AI context
messageHistorySchema.methods.toContextFormat = function() {
  const senderName = this.isBot ? 'Zani' : this.userNumber;
  return `${senderName}: ${this.content}`;
};

export const MessageHistory = mongoose.model('MessageHistory', messageHistorySchema);
export default MessageHistory;
