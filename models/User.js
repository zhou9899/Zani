// models/User.js
import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document'],
    default: 'text'
  },
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  }
});

const userSchema = new mongoose.Schema({
  // WhatsApp user identification
  userNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  internalId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // User memory and behavior
  behaviorProfile: [{
    trait: String,
    frequency: {
      type: Number,
      default: 1
    },
    lastObserved: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Interaction history (limited to last 20)
  interactions: [interactionSchema],
  
  // Personality analysis
  personalityTraits: {
    isPolite: { type: Boolean, default: false },
    usesVulgarLanguage: { type: Boolean, default: false },
    frequentlyGreets: { type: Boolean, default: false },
    messageLength: {
      type: String,
      enum: ['short', 'medium', 'long'],
      default: 'medium'
    }
  },
  
  // Statistics
  stats: {
    totalMessages: { type: Number, default: 0 },
    firstSeen: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now },
    activeDays: { type: Number, default: 1 }
  },
  
  // Preferences (for future use)
  preferences: {
    language: { type: String, default: 'english' },
    aiStyle: { type: String, default: 'friendly' }
  },
  
  // Special relationships
  isZhou: {
    type: Boolean,
    default: false
  }
  
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ userNumber: 1 });
userSchema.index({ internalId: 1 });
userSchema.index({ 'stats.lastActive': -1 });
userSchema.index({ isZhou: 1 });

// Static methods
userSchema.statics.findOrCreate = async function(userNumber, internalId) {
  let user = await this.findOne({ userNumber });
  if (!user) {
    user = await this.create({
      userNumber,
      internalId,
      isZhou: userNumber === '253235986227401' // Zhou's number
    });
  }
  return user;
};

userSchema.statics.getUserMemory = async function(userNumber) {
  const user = await this.findOne({ userNumber });
  if (!user) {
    return {
      interactions: [],
      behavior_profile: [],
      last_updated: new Date()
    };
  }
  
  return {
    interactions: user.interactions,
    behavior_profile: user.behaviorProfile.map(bp => bp.trait),
    last_updated: user.updatedAt
  };
};

// Instance methods
userSchema.methods.updateBehavior = function(message) {
  const traits = this.analyzeMessageForTraits(message);
  
  traits.forEach(trait => {
    const existingTrait = this.behaviorProfile.find(bp => bp.trait === trait);
    if (existingTrait) {
      existingTrait.frequency += 1;
      existingTrait.lastObserved = new Date();
    } else {
      this.behaviorProfile.push({
        trait,
        frequency: 1,
        lastObserved: new Date()
      });
    }
  });
  
  // Update stats
  this.stats.totalMessages += 1;
  this.stats.lastActive = new Date();
  
  // Add to interactions (limit to 20)
  this.interactions.push({
    message,
    timestamp: new Date()
  });
  
  if (this.interactions.length > 20) {
    this.interactions = this.interactions.slice(-20);
  }
  
  return traits;
};

userSchema.methods.analyzeMessageForTraits = function(message) {
  const text = message.toLowerCase();
  const traits = [];

  // Behavior analysis
  if (text.match(/\b(please|pls|plz|thank|thanks|appreciate)\b/)) {
    traits.push('polite');
    this.personalityTraits.isPolite = true;
  }
  
  if (text.match(/\b(fuck|shit|asshole|bastard|bitch|damn)\b/)) {
    traits.push('uses vulgar language');
    this.personalityTraits.usesVulgarLanguage = true;
  }
  
  if (text.match(/\b(hi|hello|hey|greetings|good morning|good afternoon)\b/)) {
    traits.push('greets');
    this.personalityTraits.frequentlyGreets = true;
  }
  
  if (text.match(/\b(stupid|dumb|idiot|moron|retard)\b/)) {
    traits.push('insults others');
  }
  
  // Message length analysis
  if (text.length < 10) {
    traits.push('short message');
    this.personalityTraits.messageLength = 'short';
  } else if (text.length > 100) {
    traits.push('long message');
    this.personalityTraits.messageLength = 'long';
  } else {
    this.personalityTraits.messageLength = 'medium';
  }

  if (!traits.length) traits.push('normal conversation');
  return traits;
};

userSchema.methods.getMemorySummary = function() {
  const topTraits = this.behaviorProfile
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5)
    .map(bp => bp.trait);
    
  return {
    userNumber: this.userNumber,
    totalMessages: this.stats.totalMessages,
    firstSeen: this.stats.firstSeen,
    lastActive: this.stats.lastActive,
    topTraits,
    isZhou: this.isZhou
  };
};

const User = mongoose.model('User', userSchema);
export default User;
