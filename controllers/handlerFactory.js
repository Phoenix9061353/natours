const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
/////////////////////////////////////////////////////

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      const doc = await Model.findById(req.params.id);
      if (!doc) {
        return next(new AppError('No document found with this ID!', 404));
      }
      await Model.findByIdAndDelete(req.params.id);
      res.status(204).json({
        status: 'success',
        data: null,
      });
    } else {
      return next(new AppError(`Invalid _id: ${req.params.id}`, 400));
    }
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!doc) {
        return next(new AppError('No document found with this ID!', 404));
      }
      res.status(200).json({
        status: 'success',
        data: {
          data: doc,
        },
      });
    } else {
      return next(new AppError(`Invalid _id: ${req.params.id}`, 400));
    }
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        newData: doc,
      },
    });
  });

exports.getOne = (Model, popOption) =>
  catchAsync(async (req, res, next) => {
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      let query = Model.findById(req.params.id);
      if (popOption) query = query.populate(popOption);
      const doc = await query;
      if (!doc) {
        return next(new AppError('No document found with this ID!', 404));
      }
      res.status(200).json({
        status: 'success',
        data: {
          data: doc,
        },
      });
    } else {
      return next(new AppError(`Invalid _id: ${req.params.id}`, 400));
    }
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //以前的mongoose(5.x.x)需要定義輸入的query會不會包含data內沒有的參數
    //現在的版本(6.x.x)mongoose會自動忽略這些參數來搜尋，故已經不需要設定這些

    //Small hack to allow nested path in reviews
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    //execute query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const docs = await features.query;

    res.status(200).json({
      status: 'success',
      //results is optional
      results: docs.length,
      data: {
        data: docs,
      },
    });
  });
