/* eslint-disable */
import { showAlert } from './alert';

//type is either password or data
export const updateSettings = async (data, type) => {
  const dt = { ...data };
  const options = { method: 'PATCH' };
  const url = type === 'password' ? 'updateMyPassword' : 'updateMe';
  if (type === 'data') {
    //用formdata處理有 multipart data的情況
    const form = new FormData();
    form.append('name', dt.name);
    form.append('email', dt.email);
    form.append('photo', dt.photo);
    options.body = form;
  } else {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(dt);
  }
  const req = await fetch(`/api/v1/users/${url}`, options);

  const res = await req.json();

  if (res.status === 'success') {
    showAlert('success', `${type.toUpperCase()} updated successfully!`);
  } else {
    showAlert('error', res.message);
  }
};
