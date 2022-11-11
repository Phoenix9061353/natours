/* eslint-disable */
// import axios from 'axios';
// const axios = require('axios');
//use fetch instead of axios
import { showAlert } from './alert';
export const login = async (email, password) => {
  const req = await fetch('http://127.0.0.1:3000/api/v1/users/login', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });
  const res = await req.json();

  if (res.status === 'success') {
    showAlert('success', 'Logged in successfully!');
    window.setTimeout(() => {
      location.assign('/');
    }, 1500);
  } else {
    showAlert('error', res.message);
  }
};

export const logout = async () => {
  const req = await fetch('http://127.0.0.1:3000/api/v1/users/logout', {
    method: 'GET',
  });
  const res = await req.json();
  if (res.status === 'success') {
    // location.reload(true);
    window.setTimeout(() => {
      location.assign('/');
    }, 500);
  } else showAlert('error', 'Error logging out! Try again!');
};
