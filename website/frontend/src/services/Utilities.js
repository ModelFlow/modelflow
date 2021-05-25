import axios from 'axios';

export function makeUUID() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export function updateUrlParam(param, value) {
  const url = new URL(window.location.href);
  url.searchParams.set(param, value);

  const newurl =
    url.protocol +
    '//' +
    url.host +
    url.pathname +
    '?' +
    url.searchParams.toString();

  window.history.replaceState(null, value, newurl);
}

export function insertItem(array, item) {
  const newArray = array.slice();
  newArray.splice(0, 0, item);
  return newArray;
}

export function appendItem(array, item) {
  const newArray = array.slice();
  newArray.push(item);
  return newArray;
}

export function removeIdx(array, idx) {
  const newArray = array.slice();
  newArray.splice(idx, 1);
  return newArray;
}

export async function apiGET(url) {
  return await apiHTTP('get', url, null);
}

export async function apiPOST(url, data) {
  return await apiHTTP('post', url, data);
}

export async function apiPATCH(url, data) {
  return await apiHTTP('patch', url, data);
}

export async function apiHTTP(method, url, inputData) {
  let response = null;
  let info = {};
  try {
    response = await axios({
      method,
      url: `${process.env.REACT_APP_API_URL}${url}`,
      data: inputData,
    });
  } catch (error) {
    // Error 😨
    if (error.response) {
      /*
       * The request was made and the server responded with a
       * status code that falls out of the range of 2xx
       */
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
      info.error = `Encountered: ${error.response.status}`;
    } else if (error.request) {
      /*
       * The request was made but no response was received, `error.request`
       * is an instance of XMLHttpRequest in the browser and an instance
       * of http.ClientRequest in Node.js
       */
      console.log(error.request);
      info.error = error.request;
    } else {
      // Something happened in setting up the request and triggered an Error
      console.log('Error', error.message);
      info.error = error.message;
    }
    console.log(error);
    return info;
  }
  const { data } = response;
  return data;
}
