var read = require('node-readability');
var async = require('async');

var emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

function refineText(text, next) {
  async.waterfall([
    function(callback){ // 필요없는 부분 제거. (), 이메일 제거 등등..
      text = text.replace(/\([^)]+\)/g, '');
      text = text.replace(/\[[^\]]+\]/g, '');
      text = text.replace(/\S+@\S+\.\S+/, ''); // 이메일 제거
      text = text.replace(/\S+@\S+\.\S+\.\S+/, '');

      callback(null, text);
    },
    function(text, callback) { // 문단으로 분리
      splitToParagraphs(text, callback);
    },
    function(paragraphs, callback){ // 온점이 없는 문단은 지운다.
      paragraphs = paragraphs.filter(function(para) {
        if(para.includes('.')) return true;
        else return false;
      });
      callback(null, paragraphs);
    },
    function(paragraphs, callback) { // 각 문단을 문장으로 쪼개기서 하나의 배열에 넣기.
      /// 여기까진 되고..
      splitToSentences (paragraphs, callback);
    }
  ],function(err, result){
    if(err) throw err;
    next(result);
  });
}

function splitToParagraphs (text, callback) {
  var paragraphs = text.split('\n');
  callback(null, paragraphs);
}

function splitParagraphsSentences (paragraphs, callback) {
  var result = [];
  async.eachSeries(paragraphs, function(para, callback){
    var sentences = para.match(/[^\.!\?\/]+[\.!\?]+/g);
    if(sentences.length !== 0){
      result.push(sentences);
    }
    callback();
  }, function(err){
    callback(null, result);
  });
}

function splitToSentences (paragraphs, callback) {
  var result = [];
  async.eachSeries(paragraphs, function(para, callback){
    var sentences = para.match(/[^\.!\?\/]+[\.!\?]+/g);
    if(sentences.length !== 0){
      for(var i = 0; i < sentences.length; i++){
        result.push(sentences[i]);
      }
    }
    callback();
  }, function(err){
    callback(null, result);
  });
}

module.exports = {
  refine: function(url, callback){
    read(url, function(err, article, meta) {
      var text = "";
      if(url.includes("news.naver")){
        var dom = article.document;
        //<br> 사이에 있는 것들만 각각 문단으로 가져오게 하기
        text = dom.getElementById("articleBodyContents").textContent;
      }
      else{
        text = article.textBody;
      }
      refineText(text, callback);
    });
  }
};
