import express from 'express';
import {
  getCheckoutSession,
  createBooking,
  getBooking,
  getAllBookings,
  updateBooking,
  deleteBooking,
} from '../controllers/bookingController.js';
import { protect, restrictTo } from '../controllers/authController.js';

// allows us to use the param id from the parent route here, in our case the tour id
export const router = express.Router();

router.use(protect);

router.get('/checkout-session/:tourId', protect, getCheckoutSession);

router.use(restrictTo('admin', 'lead-guide'));

router.route('/').get(getAllBookings).post(createBooking);
router.route('/:id').get(getBooking).patch(updateBooking).delete(deleteBooking);
