import './loadEnv.js'; //Unfortunately, had to import this way due to some stupid race conditions going
// on in my PC.

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import { AppError } from './utils/appError.js';
import globalErrorHandler from './controllers/errorController.js';
import express from 'express';
import morgan from 'morgan';
import { router as tourRouter } from './routes/tourRoutes.js';
import { router as userRouter } from './routes/userRoutes.js';
import { router as reviewRouter } from './routes/reviewRoutes.js';
import { router as viewRouter } from './routes/viewRoutes.js';
import { router as bookingRouter } from './routes/bookingRoutes.js';
import cookieParser from 'cookie-parser';

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export const app = express();

app.set('view engine', 'pug');
app.set('views', './views');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, 'public'))); //works for static files in the public directory including children directories
app.use(cookieParser());

// 1) GLOBAL middleware
//Set Security HTTP headers
// Further HELMET configuration for Security Policy (CSP)
const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://cdn.jsdelivr.net',
  'https://js.stripe.com', // allow Stripe.js
];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
];
const connectSrcUrls = [
  'https://unpkg.com',
  'https://tile.openstreetmap.org',
  'http://127.0.0.1:3000',
  'ws://127.0.0.1:4859',
];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

//set security http headers
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      frameSrc: ['https://js.stripe.com'], // <-- allow Stripe Checkout frames
      workerSrc: ["'self'", 'blob:'],
      objectSrc: ["'none'"],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

console.log(`App running in ${process.env.NODE_ENV} environment...`);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Only allow 100 request from an IP each hour
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading json data from body and limiting it to 10kb
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); //custom property, not the same as params.
  next();
});

// 2) route handlers

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// 3) routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); //here we've added these routes as middleware, so sub-routes can be mounted on top
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  // Whenever we put anything in next(), it will automatically know its an error, and skip all middleware, going straight to the error middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Here is the rundown of what's going on here:
// 1) We redefined the Error class so we can tailor it for our App by settings certain properties as we like.
// 2) Then we use that class to throw error wherever we see fit, making sure to pass it into next(),
// 3) so that it ends up right in this middleware that uses the globalErrorHandler controller.
app.use(globalErrorHandler);
