import 'bootstrap/dist/css/bootstrap.min.css';
import './App.scss'
import React from 'react';
import { hot } from 'react-hot-loader/root'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
} from "react-router-dom";
import * as Pages from './pages';

window.server = '/janusbase/janus'

function App() {

  return (
    <Router> 
        <Switch>
          <Route exact path="/">
            <Redirect to="/view/4" />
          </Route>
          <Route path="/nav" component={Pages.Nav} />
          <Route path="/sim" component={Pages.Sim} />
          <Route path="/config" component={Pages.StreamConfig} />
          <Route path="/view/:id" component={Pages.View} />
          <Route path="/view" component={Pages.StreamViewIndex} />
          <Route path="/hello" component={Pages.Hello} />
          <Route path="/intro" component={Pages.Intro} />
        </Switch>
    </Router> 
  );
}

export default process.env.NODE_ENV === "development" ? hot(App) : App