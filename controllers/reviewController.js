import { Review } from '../models/reviewModel.js';
// import catchAsync from '../utils/catchAsync.js';
import {
  createOne,
  deleteOne,
  updateOne,
  getAll,
  getOne,
} from './handlerFactory.js';

export const setTourIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

export const getAllReviews = getAll(Review);
export const getReview = getOne(Review);
export const createReview = createOne(Review);
export const updateReview = updateOne(Review);
export const deleteReview = deleteOne(Review);
