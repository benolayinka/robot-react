import React from 'react'
import {Link} from "react-router-dom";

export default nav => {
    return(
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
    )
}