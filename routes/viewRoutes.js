const express = require('express');
const {
  getOverview,
  getTour,
  getLoginForm,
  getAccount,
  getSignUpForm,
  getMyTours,
} = require('../controllers/viewController');
const { isLoggedIn, protect } = require('../controllers/authController');
const { createBookingCheckout } = require('../controllers/bookingController');
///////////////////////////////////////
const router = express.Router();
// router.use(isLoggedIn);
//避免isLoggedIn與protect的內容互衝
router.get('/', createBookingCheckout, isLoggedIn, getOverview);
router.get('/tour/:tourSlug', isLoggedIn, getTour);
router.get('/login', isLoggedIn, getLoginForm);
router.get('/signup', isLoggedIn, getSignUpForm);
router.get('/me', protect, getAccount);
router.get('/my-tours', protect, getMyTours);

// router.post('/submit-user-data', protect, updateUserData);

module.exports = router;
