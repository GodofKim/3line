import React, { Component, PropTypes } from 'react';
import './Header.css';
import logo from './logo.png';

class Header extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <div>
              <div className="navbar">
                <ul id="nav-button">
                  <li>
                    <a href="#">
                      <img id="logo" src={logo} />
                    </a>
                  </li>
                </ul>

              </div>
            </div>
        );
    }
}

export default Header;
