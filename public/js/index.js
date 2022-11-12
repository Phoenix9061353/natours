/* eslint-disable */

import 'regenerator-runtime/runtime.js';
// require('regenerator-runtime/runtime');
import { displayMap } from './leaflet';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { signup } from './signUp';
import { bookTour } from './stripe';
import { showAlert } from './alert';

//DOM Element
const leafletMap = document.getElementById('map');
const logInForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const updateDataForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-settings');
const signUpForm = document.querySelector('.form--signUp');
const bookBtn = document.getElementById('book-tour');
///////////////////////////////////////////////////////////////////
//Map
if (leafletMap) {
  const locations = JSON.parse(leafletMap.dataset.locations);
  displayMap(locations);
}

//Sign up
if (signUpForm) {
  signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--sign-up').textContent = 'Please waiting...';
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await signup(name, email, password, passwordConfirm);
    document.querySelector('.btn--sign-up').textContent = 'Sign Up';
  });
}

//Log in
if (logInForm) {
  logInForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

//Log out
if (logOutBtn) logOutBtn.addEventListener('click', logout);

//讓登入的使用者能改自己的資料（名字、email、照片）
if (updateDataForm) {
  updateDataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-settings').textContent = 'UPDATING...';
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const photo = document.getElementById('photo').files[0];

    await updateSettings({ name, email, photo }, 'data');
    document.querySelector('.btn--save-settings').textContent = 'SAVE SETTINGS';
    window.setTimeout(location.reload(true), 6000);
  });
}

//讓登入的使用者能改自己的資料（密碼）
if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', async (e) => {
    // // guard to check if different form submitted
    // if (!e.target.classList.contains('form-user-settings')) {
    //   return;
    // }
    e.preventDefault();
    document.querySelector('.btn-save-password').textContent = 'Updating...';
    const oldPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const newPasswordConfirm =
      document.getElementById('password-confirm').value;
    await updateSettings(
      { oldPassword, newPassword, newPasswordConfirm },
      'password'
    );
    document.querySelector('.btn-save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (bookBtn)
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });

const alertMsg = document.querySelector('body').dataset.alert;
if (alertMsg) showAlert('success', alertMsg, 20);
