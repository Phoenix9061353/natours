/* eslint-disable */

import { showAlert } from './alert';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51Loo21IIKOWWxX27FP7yCHnxij7qIjGAmHxtMJVCq5ZTucKXO0ZwP4RLsGypzdBYx4a8DIZYGfr84EeXTOI1UDxQ0003l7V6b5'
  );
  //1) Get session from API
  try {
    const session = await fetch(`/api/v1/booking/checkout-session/${tourId}`, {
      method: 'GET',
    });
    const resSession = await session.json();
    //2) 送出checkout form + 信用卡付帳(導向生成的付款頁面)
    window.location.replace(resSession.session.url);
  } catch (err) {
    showAlert('error', err);
  }
};
