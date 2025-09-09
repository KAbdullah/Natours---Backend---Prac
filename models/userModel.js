import mongoose from 'mongoose';
import validator from 'validator';
import bycrpt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on create/save, not update!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // Hash the password with cost of 12
  this.password = await bycrpt.hash(this.password, 12);
  // Once hashed, remove passwordConfirm field,
  // Only required as input, doesn't need to be persisted
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre('/^find/', function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

// This is an instance method,
// meaning it is available on all instances of this document.
// so you can call it as a method
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bycrpt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    // Later dates of changing password automatically means
    // greater seconds time.
    // So, true here means we changed password after issuing JWT token
    // which means we can't authenticate the user.
    return JWTTimestamp < changedTimestamp;
  }
  // false means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash the password so it can no longer be used by someone who may gain access to our database
  // We hash it with an algorithm sha256, then tell it what to hash by using .update and our resetToken, and finally spit it out in hex
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

export const User = mongoose.model('User', userSchema);
