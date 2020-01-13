import React from 'react';
import StreamConfig from './components/StreamConfig/StreamConfig.js'
import StreamViewIndex from './components/StreamView/StreamViewIndex.js'
import { hot } from 'react-hot-loader/root'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

//export const JanusServerContext = React.createContext('/janusbase/janus');
window.server = '/janusbase/janus'

function App() {
  return (
//    <JanusServerContext.Provider>
    <Router>  
      <div>
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

        <Switch>
          <Route path="/config">
            <StreamConfig />
          </Route>
          <Route path="/view">
            <StreamViewIndex />
          </Route>
          <Route path="/">
            hi
          </Route>
        </Switch>
      </div>
    </Router> 
//    </JanusServerContext.Provider>
  );
}

export default process.env.NODE_ENV === "development" ? hot(App) : App