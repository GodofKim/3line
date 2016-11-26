import React, { Component } from 'react';
import './App.css';
import axios from 'axios';
import ReactSpinner from 'react-spinjs';
import Header from './Components/Header';

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      shorten : undefined
    };

    this.fetchShorten = this.fetchShorten.bind(this);
    this.printShorten = this.printShorten.bind(this);
  }

  componentDidMount(){
    this.fetchShorten();
  }

  fetchShorten() {
    var URL = 'http://localhost:4000/hello';

    var request = (tabs) => {
      console.log(tabs[0].url);
      axios({
        method: 'get',
        url: URL,
        headers: {
          pageurl : tabs[0].url
        }
      })
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
    };

    chrome.tabs.query({currentWindow: true, active: true}, request.bind(this));
}
  printShorten() {
    if(this.state.shorten){
      return (
        <div className="shorten">
          <p>1 : {this.state.shorten[0]}</p>
          <p>2 : {this.state.shorten[1]}</p>
          <p>3 : {this.state.shorten[2]}</p>
          <p className="footer">Redesigned by 3Line</p>
        </div>
      );
    } else {
      return (
        <div>
          <ReactSpinner top="50%" left="50%"/>
        </div>
      );
    }
  }

  render() {

    return (
      <div className="App">
        <Header />
        <div className="App-intro">
          {this.printShorten()}
        </div>
      </div>
    );
  }
}

export default App;
