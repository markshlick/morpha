import 'core-js/modules/es7.symbol.async-iterator';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';

import App from './App';

ReactDOM.hydrate(
  <Router>
    <App />
  </Router>,
  document.getElementById('root'),
);

if (module.hot) {
  module.hot.accept();
}
