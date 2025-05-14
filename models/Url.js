import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
  shortId: {
    type: String,
    required: true,
    unique: true
  },
  longUrl: {
    type: String,
    required: true
  },
  customAlias: {
    type: String,
    unique: true,
    sparse: true
  },
  clicks: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  analytics: [{
    timestamp: Date,
    ip: String,
    userAgent: String,
    referrer: String,
    country: String,
    city: String
  }]
}, {
  timestamps: true
});

// Index for faster queries
urlSchema.index({ shortId: 1 });
urlSchema.index({ customAlias: 1 });

const Url = mongoose.model('Url', urlSchema);

export default Url;
