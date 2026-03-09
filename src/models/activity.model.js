import mongoose from 'mongoose';

/**
 * Activity Schema
 * Tracks user activities for audit logging and security monitoring
 */
const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'login',
        'logout',
        'register',
        'update_profile',
        'change_password',
        'delete_account',
        'admin_action',
        'api_access',
      ],
    },
    description: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'warning'],
      default: 'success',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ action: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

/**
 * Static method: Log user activity
 * @param {Object} activityData - Activity data
 * @returns {Promise<Activity>}
 */
activitySchema.statics.logActivity = async function (activityData) {
  return this.create(activityData);
};

/**
 * Static method: Get user activities
 * @param {string} userId - User ID
 * @param {Object} options - Query options (limit, skip)
 * @returns {Promise<Activity[]>}
 */
activitySchema.statics.getUserActivities = function (userId, options = {}) {
  const { limit = 50, skip = 0 } = options;
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;

