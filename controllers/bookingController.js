const Stripe = require('stripe');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const User = require('../models/userModel');
///////////////////////////////////////////////////
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1) 取得指定要被booking的tour data
  const tour = await Tour.findById(req.params.tourID);
  if (!tour) return next(new AppError('Can not find this tour!', 500));
  //2) 創建一個booking確認的session(透過stripe來製作；現在的stripe可能已經有點不同了，記得看doc)
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.create({
    //付款方式
    payment_method_types: ['card'],
    mode: 'payment',
    //成功後導向頁面（首頁）
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${
    //   req.params.tourID
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    //取消後導向頁面（當前頁面）
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    line_items: [
      {
        quantity: 1,
        price_data: {
          unit_amount: tour.price * 100,
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            // images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${
                tour.imageCover
              }`,
            ],
          },
        },
      },
    ],
  });
  //3) 將此session送回給user
  res.status(200).json({
    status: 'success',
    session,
  });
});

// //在付款完成跳回主頁時，生成確認booking成立的middleware
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   //1) 確認booking成功後導向的網址是否有指定資料(非安全法：只要有人知道網址結構就可以直接跳過付款來成立Booking)
//   const { tour, user, price } = req.query;
//   if (!tour || !user || !price) return next();
//   //2) 建立並儲存Booking進DB
//   await Booking.create({ tour, user, price });
//   //3) 確認建立後，將網頁導回一開始的主頁（避免導向網址的資料外流（非最佳解））
//   res.redirect(req.originalUrl.split('?')[0]);
// });

exports.createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_KEY
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    this.createBookingCheckout(event.data.object);
  }

  res.status(200).json({ received: true });
};

//Use factory to complete CRUD
exports.createBooking = factory.createOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
