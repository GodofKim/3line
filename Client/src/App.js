import React, { Component } from 'react';
import './App.css';
import axios from 'axios';
import ReactSpinner from 'react-spinjs';
import Header from './Components/Header';
import {SERVER_URL} from './URL';

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      title : undefined,
      shorten : undefined
    };

    this.fetchShorten = this.fetchShorten.bind(this);
    this.printShorten = this.printShorten.bind(this);
    this.printTitle = this.printTitle.bind(this);
  }

  componentDidMount(){
    this.fetchShorten();
  }

  fetchShorten() {
    var URL = SERVER_URL;

    var request = (tabs) => {
      chrome.tabs.executeScript( {
        code: "window.getSelection().toString();"
      }, (function(selection) {
        var API = "";
        var method = "";
        var headers = {
          "Content-Type":"application/json"
        };
        var body = {};

        if(selection[0]){
          API = URL + "highlight";
          method = "post";
          body.text = selection[0];
          console.log(selection);
        }else{
          console.log(tabs[0].url);
          API = URL;
          method = "get";
          headers.pageurl = tabs[0].url;
        }

        axios({
          method: method,
          url: API,
          headers: headers,
          data: body
        })
        .then((response) => {
          console.log(response);
          this.setState({
            title : response.data.title,
            shorten : response.data.shorten
          });
        })
        .catch((error) => {
          throw error;
          this.setState({
            title : "서버 오류 발생",
            shorten : error
          });
        });
      }).bind(this));
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

  printTitle() {
    if(this.state.title){
      return (
        <div className="title">
          <h3>{this.state.title}</h3>
        </div>
      );
    }
  }

  render() {
    return (
      <div className="App">
        <Header />
        <div className="App-intro">
          {this.printTitle()}
          {this.printShorten()}
        </div>
      </div>
    );
  }
}

export default App;
