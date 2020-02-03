//import 'bootstrap/dist/css/bootstrap.min.css';
import './custom.scss';
import React from 'react';
import StreamConfig from './components/StreamConfig/StreamConfig.js'
import StreamViewIndex from './components/StreamView/StreamViewIndex.js'
import { hot } from 'react-hot-loader/root'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
} from "react-router-dom";

window.server = '/janusbase/janus'

function App() {
  return (
    <Router>  
      <div>
        <Switch>
          <Route path="/nav">
            <nav>
              <ul>
                <li>
                  <Link to="/config">config</Link>
                </li>
                <li>
                  <Link to="/view">view</Link>
                </li>
              </ul>
            </nav>
          </Route>
          <Route path="/config">
            <StreamConfig />
          </Route>
          <Route path="/view">
            <StreamViewIndex />
          </Route>
          <Route path="/">
            <Redirect to="/view/1" />
          </Route>
        </Switch>
      </div>
    </Router> 
  );
}

export default process.env.NODE_ENV === "development" ? hot(App) : App