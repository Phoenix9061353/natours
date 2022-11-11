const express = require('express');
//third-party middle ware
const app = express();
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
///////////////////////////////////////////
app.enable('trust proxy');
//PUG setting
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//Serving static files
app.use(express.static(path.join(__dirname, 'public')));
///////////////////////////////////////////
//Global Middleware: 負責處理req與res，以輸出最後res的程式
//Set security Http headers
// app.use(helmet());
// Further HELMET configuration for Security Policy (CSP)
const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://cdnjs.cloudflare.com',
  'http://127.0.0.1:3000',
  'https://js.stripe.com',
  'https://*.stripe.com/',
  'https://m.stripe.network',
];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
  'https://cdnjs.cloudflare.com',
];
const connectSrcUrls = [
  'https://unpkg.com',
  'https://tile.openstreetmap.org',
  'https://cdnjs.cloudflare.com',
  'http://127.0.0.1:3000',
  'ws://127.0.0.1:*',
  'https://js.stripe.com',
  'https://m.stripe.network',
];
const fontSrcUrls = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'blob:', 'data:', 'https:', 'http:'],
      baseUri: ["'self'"],
      connectSrc: ["'self'", 'blob:', ...connectSrcUrls],
      scriptSrc: [
        "'self'",
        'https:',
        'http:',
        'blob:',
        'ws:',
        ...scriptSrcUrls,
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https:',
        'http:',
        ...styleSrcUrls,
      ],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: ["'none'"],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      fontSrc: ["'self'", 'blob:', 'data:', 'https:', 'http:', ...fontSrcUrls],
    },
  })
);

//設定開發環境為“開發”
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//限制定時內可接收的req數量
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in another hour!',
});
app.use('/api', limiter);

//Body parser, reading data from body to req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//Data sanitization(against NoSQL query injection)
//也就是利用這個避免任何偷利用 NoSQL的 query的特性來偷吃步的行為發生
app.use(mongoSanitize());

//Data sanitization(against XSS)
//防止使用者用輸入html程式碼的方式造成 attack（直接改變輸入的html碼）
app.use(xss());

//Prevent parameters pollution
//可看hpp的介紹來了解此pollution（重複的parameter）的運作，此 middleware會直接挑最後的來執行
//可設白名單使parameter不會受到此middleware影響
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//Practice create our own middleware
//注意：若在結束了req/res cycle的程式之後才加middleware程式，則該程式便不會經過此middleware處理
//在此例中，因擺在全部的route執行的上面，故進行時都會經過此middleware
// app.use((req, res, next) => {
//   console.log('Hello from the middleware!');
//   //執行next function(必須，否則會卡住)
//   next();
// });
app.use(compression());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});
///////////////////////////////////////////
//Route
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can not find ${req.originalUrl} on this server!`, 404));
});
//Error handler
app.use(globalErrorHandler);

///////////////////////////////////////////
module.exports = app;
