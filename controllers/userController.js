const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
//////////////////////////////////////////
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};
//////////////////////////////////////////
//multer相關設定
//1)設定要存在哪、檔名格式(disk)
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     //user-(user.ID)-(儲存時間).jpeg
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });
//另：存於memory(as buffer；便於先存取修改)
const multerStorage = multer.memoryStorage();
//2)過濾限制使用者只能上傳圖片
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an Image! Please upload only images!', 400), false);
  }
};
//用 multer設定上傳後的圖片要存在哪(簡易版)
// const upload = multer({ dest: 'public/img/users' });
//用 multer設定上傳後的圖片要存在哪(正式版)
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

//single -> 只上傳一張；photo -> 指定上傳檔案的儲存 field
exports.uploadUserPhoto = upload.single('photo');

//在正式的update前，檢視照片是否能被好好的使用（元設定只適用於正方形的圖片）
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  //利用sharp來調整圖片，最後存回disk(須設置完整路徑)
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

//////////////////////////////////////////
exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
  //1) 如果使用者試圖使用此route改密碼，顯示error
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for updating password! Please try it at /updateMyPassword',
        400
      )
    );
  }
  //2) 完成更改資料的動作
  //注意這裡不能使用前面單純的.find和.save，因為方便使用者有時只想改部分的資料
  //而且也要限制使用者可以更改的資料範圍（像在此例中，就不允許改變role，故要設置filteredBody）
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined, please use /signup path!',
  });
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
////////////////////////////////////////////////////
//Use factory functions
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
//Do not change password use this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
