export function makeUUID() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export function updateUrlWithId(id) {
  const url = new URL(window.location.href);
  url.searchParams.set('id', id);

  const newurl =
    url.protocol +
    '//' +
    url.host +
    url.pathname +
    '?' +
    url.searchParams.toString();

  window.history.replaceState(null, id, newurl);
}

export function insertItem(array, item) {
  const newArray = array.slice();
  newArray.splice(0, 0, item);
  return newArray;
}

export function removeItem(array, idx) {
  const newArray = array.slice();
  newArray.splice(idx, 1);
  return newArray;
}
