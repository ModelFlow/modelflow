import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import Main from './components/Main/Main.jsx';
import * as serviceWorker from './serviceWorker';

import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import * as reducers from './state/reducers';
import { createStore, applyMiddleware, combineReducers } from 'redux';

const store = createStore(combineReducers(reducers), applyMiddleware(thunk));

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <Main />
    </Provider>{' '}
  </React.StrictMode>,
  document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
