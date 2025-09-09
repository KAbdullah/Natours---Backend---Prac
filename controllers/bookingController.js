import Stripe from 'stripe';
import { Tour } from '../models/tourModels.js';
import { Booking } from '../models/bookingModel.js';
import { AppError } from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} from './handlerFactory.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://natours.dev/img/tours/${tour.imageCover}`],
          },
        },
        quantity: 1,
      },
    ],
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// Middleware to create a booking after a successful checkout session.
// When the user is redirected to the homepage (success URL), the query parameters
// (tour, user, price) are used to create a booking record in the database.
// After creating the booking, the user is redirected to the original URL,
// with the query parameters removed, ensuring a clean and secure URL.
export const createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });

  //redirect makes us hit the home url again, but this time since the tour, user and price are missing
  // we simply go to the next middleware function in that route, which is the getOverview function
  res.redirect(req.originalUrl.split('?')[0]);
});

export const createBooking = createOne(Booking);
export const getBooking = getOne(Booking);
export const getAllBookings = getAll(Booking);
export const updateBooking = updateOne(Booking);
export const deleteBooking = deleteOne(Booking);
