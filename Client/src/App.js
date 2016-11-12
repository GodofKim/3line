import React, { Component } from 'react';
import logo from './logo.png';
import './App.css';
import axios from 'axios';

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      shorten : []
    };

    this.fetchShorten = this.fetchShorten.bind(this);
    this.printShorten = this.printShorten.bind(this);
  }

  componentDidMount(){
    this.fetchShorten();
  }

  fetchShorten() {
    var URL = 'http://localhost:4000';
    return axios.get(URL)
    .then((response) => {
      console.log(response);
      this.setState({
        shorten : response.data.shorten
      });
    })
    .catch((error) => {
      this.setState({
        shorten : error
      });
    });
  }

  printShorten() {
    if(this.state.shorten){
      return (
        <div>
          <p>1 : {this.state.shorten[0]}</p>
          <p>2 : {this.state.shorten[1]}</p>
          <p>3 : {this.state.shorten[2]}</p>
        </div>
      );
    }
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo"/>
          <h2>Redesigned by 3Line</h2>
        </div>
        <div className="App-intro">
          {this.printShorten()}
        </div>
      </div>
    );
  }
}

export default App;
