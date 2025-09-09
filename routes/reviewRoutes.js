import express from 'express';
import {
  getAllReviews,
  createReview,
  deleteReview,
  setTourIds,
  updateReview,
  getReview,
} from '../controllers/reviewController.js';
import { protect, restrictTo } from '../controllers/authController.js';

// allows us to use the param id from the parent route here, in our case the tour id
export const router = express.Router({ mergeParams: true });

router.use(protect);

router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), setTourIds, createReview);

router
  .route('/:id')
  .get(restrictTo('user', 'admin'), getReview)
  .patch(updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview);
