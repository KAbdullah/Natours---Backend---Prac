import axios from 'axios';
import { showAlert } from './alerts.js';

export const bookTour = async (tourId) => {
  try {
    // 1) Get the checkout session from the API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );

    // I put this here, because for some reason, the pug script loads after we call this, so now I await it.
    // Don't use the new keyword because we aren't trying to open up a new session each time.
    const stripe = await Stripe(
      'pk_test_51RxIoTFHqAUjfa2OA6vkNeTdsiHwSTCRAPNfl1yaG18aqXnXjS3nxfRoTN0pppkFlubdAKp3ECLGYl14NfXg3e2T00WOQ4ShBE'
    );

    // 2) Create checkout form + charge the credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
