/* eslint-disable */

import { showAlert } from './alert';
export const signup = async (name, email, password, passwordConfirm) => {
  const req = await fetch('/api/v1/users/signup', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      email,
      password,
      passwordConfirm,
    }),
  });
  const res = await req.json();
  if (res.status === 'success') {
    showAlert('success', 'Sign up successfully!');
    window.setTimeout(() => {
      location.assign('/');
    }, 1500);
  } else {
    showAlert('error', res.message);
  }
};
