const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

//////////////////////////////////////////
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendResToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  //讓token以cookie的方式傳給使用者（在真實網站中）
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: false,
    httpOnly: true,
  };
  //保障在 Http下才會製作此cookie送出（保護機制，使用者使用時使用）
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};
//////////////////////////////////////////
//註冊（指定格式，避免接收不必要資料）
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangeAt: undefined,
    // role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  //localhost:3000
  await new Email(newUser, url).sendWelcome();

  sendResToken(newUser, 201, res);
});

//////////////////////////////////////////
//使用者登入（用郵件地址和密碼）
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1)確認是否有輸入email和 password
  if (!email || !password) {
    return next(new AppError('Please provide your email and password!', 400));
  }
  //2)確認user是否存在 && 密碼是否正確
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Email or Password is not correct!', 401));
  }
  //3)全部通過之下，將token送回給client
  sendResToken(user, 200, res);
});

//////////////////////////////////////////
//Log out(此例中，用創建一個新的且很快過期的cookie token出來，覆蓋原有的token)
exports.logOut = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

//////////////////////////////////////////
//設定部分功能的權限（需登入才能查詢所有的tour資料）
exports.protect = catchAsync(async (req, res, next) => {
  //1) 取得token並確認
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }
  //2) 檢查token的verification
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3) 檢查DB中，是否有此token的user資料
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user blonging to this token does no longer exist', 401)
    );
  }
  //4) 檢查在送出此token後，user是否有改密碼
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'Password recently changed! Please try to log in again.',
        401
      )
    );
  }
  //所有檢查通過
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

//////////////////////////////////////////
//用作網頁顯示用，並不會送出 error
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //1) 檢查jwt的verification
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //2) 檢查DB中，是否有此token的user資料
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //3) 檢查在送出此token後，user是否有改密碼
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      //所有檢查通過(目前有使用者登入)
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

//////////////////////////////////////////
//設定部分功能的權限（需為特定身份才能刪除tour）
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

//////////////////////////////////////////
//忘記密碼（使用者用註冊時的郵件地址提出申請）
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) 用輸入的郵件地址確認是否有註冊過
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with the email address', 404));
  }

  //2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  //儲存改動的資料（createPasswordResetToken裡生成的token碼和過期時間）
  await user.save({ validateBeforeSave: false });

  //3) Send the token to user's email
  //生成要傳給使用者的網址與訊息
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  // const message = `Forgot your password?\nTry to reset it by submitting a PATCH request (new password + passwordConfirm) to\n${resetURL}\nIf you don't have the need, please ignore this email!`;
  //寄送
  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    // });
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Email send success!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordRestExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error with sending email. Try again!', 500)
    );
  }
});
//////////////////////////////////////////
//重設密碼
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on token
  //以 token來搜尋 DB中的 user資料（比對 hash後的 token是否一樣，以及此 resetToken是否還沒過期）
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordRestExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('Token is invalid or has expired!', 400));
  }
  //2) If token is not expired, and there's the user, reset password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordRestExpires = undefined;
  await user.save();
  //3) Update the changePasswordAt for the user（在model中使用middleware）
  //4) Log the user in, send JWT
  sendResToken(user, 200, res);
});

//////////////////////////////////////////
//重設密碼（登入狀態）
exports.updateMyPassword = catchAsync(async (req, res, next) => {
  //1) 取得user資料(執行此路徑前，確認使用者是否登入(protect))
  const user = await User.findOne({ email: req.user.email }).select(
    '+password'
  );

  //2) 確認密碼
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return next(
      new AppError(
        'Please provide your old password and set your new one!',
        400
      )
    );
  }
  if (!(await user.correctPassword(oldPassword, user.password))) {
    return next(new AppError('Old password is not the same!', 401));
  }
  //3) 以上都通過，更改密碼
  user.password = newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();
  //4) 以新密碼登入使用者，送出JWT
  sendResToken(user, 200, res);
});
