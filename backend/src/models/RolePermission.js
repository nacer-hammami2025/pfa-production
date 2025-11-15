const mongoose = require('mongoose');

const capabilitySchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String, required: true },
    enabled: { type: Boolean, default: true }
  },
  { _id: false }
);

const rolePermissionSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'admin'], unique: true, required: true },
  permissions: { type: [capabilitySchema], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

rolePermissionSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('RolePermission', rolePermissionSchema);
