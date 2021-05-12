import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import Main from './components/Main/Main.jsx';
import Project from './components/Project/Project.jsx';
import Projects from './components/Projects/Projects.jsx';

import * as serviceWorker from './serviceWorker';

import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import * as reducers from './state/reducers';
import { createStore, applyMiddleware, combineReducers } from 'redux';
// Link, NoMatch
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { composeWithDevTools } from 'redux-devtools-extension';

const store = createStore(
  combineReducers(reducers),
  composeWithDevTools(applyMiddleware(thunk)),
);

// Note strictmode breaks flow chart
ReactDOM.render(
  <>
    <Provider store={store}>
      <Router>
        <div>
          {/* A <Switch> looks through its children <Route>s and
              renders the first one that matches the current URL. 
              
              Note: You need to use component= with an id
              */}
          <Switch>
            <Route path="/sim">
              <Main />
            </Route>
            <Route path="/projects/:projectId" component={Project} />
            <Route exact path="/">
              <Projects />
            </Route>
          </Switch>
        </div>
      </Router>
    </Provider>{' '}
  </>,
  document.getElementById('root'),
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
