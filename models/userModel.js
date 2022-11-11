const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'Please tell us your name!'],
  },

  email: {
    type: String,
    unique: true,
    required: [true, 'Please provide your email address!'],
    lowercase: true,
    validate: [validator.isEmail, 'Invalid email!'],
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
    required: [true, 'Please set password!'],
    minlength: 8,
    select: false,
  },

  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },

  passwordChangeAt: Date,
  passwordResetToken: String,
  passwordRestExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//hash or encryption password in DB
userSchema.pre('save', async function (next) {
  //如果沒更改密碼的話就直接跳過這個 middleware
  if (!this.isModified('password')) return next();
  //bcrypt(after password has been confirmed, it is no need to save it in DB)
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

//While changing the password, changing the passwordChangedAt property
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  //確保避免密碼的token尚未生成
  this.passwordChangeAt = Date.now() - 1000;
  next();
});

//在執行任何find前，先過濾只有active的資料會被使用
userSchema.pre(/^find/, function (next) {
  //這裡的 this相當於當前的 query
  this.find({ active: { $ne: false } });
  next();
});

//compare the input password with that in the DB（利用 bcrypt compare method來直接比較輸入字串與已被hash過的字串）
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//測試是否在收到此token後有先改密碼，沒取得新token的情況下再送出相同的token
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangeAt) {
    const changedTimestamp = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

//回傳一個改密碼用的隨機token
userSchema.methods.createPasswordResetToken = function () {
  //生成隨機碼
  const resetToken = crypto.randomBytes(32).toString('hex');
  //將生成的 resetToken加上hash，存進 DB裡的 passwordResetToken
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  //設定此 resetToken 的過期時間（產生的10分鐘後）
  this.passwordRestExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
