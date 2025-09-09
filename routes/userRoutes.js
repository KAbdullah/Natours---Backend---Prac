import express from 'express';
import {
  getAllUsers,
  getUser,
  updateUser,
  createUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
} from '../controllers/userController.js';
import {
  signup,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  udpatedPassword,
  logout,
} from '../controllers/authController.js';
import { createReview } from '../controllers/reviewController.js';

export const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

router.get('/logout', logout);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

// Protect all routes after this middleware
router.use(protect);

router.patch('/updateMyPassword', udpatedPassword);
router.get('/me', getMe, getUser);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/deleteMe', deleteMe);

router.use(restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);
router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(restrictTo('admin', 'lead-guide'), deleteUser);
