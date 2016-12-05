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
      text = '도널드 트럼프가 미국 대통령에 당선된 직후 불붙은 반(反)트럼프 시위가 극에 달하고 있다. 9일 워싱턴DC와 뉴욕에서 시작된 시위가 10일 버지니아와 매사추세츠, 일리노이, 텍사스, 캘리포니아 등의 50여 도시로 확산됐다. 시위에 고교생이 참여하고 화염병이 등장하는 등 과격해지고 있다. 로스앤젤레스에서는 도로를 점거한 시위대 20여명이, 오클랜드에서는 경찰에 화염병 등을 던진 시위대 30여명이 체포됐다. 전날 뉴욕에서 붙잡힌 65명을 포함하면 이날까지 200여명이 연행됐다. 샌프란시스코에서는 고교생 1000여명이 시위에 참가하는 등 시위대 상당수는 대학생과 히스패닉, 흑인, 무슬림 등 트럼프의 성·인종·종교 차별 언행에 피해를 받았다고 주장하는 이들이라고 CNN 등이 보도했다. 특히 트럼프 당선자가 거주하는 뉴욕 맨해튼은 수천명이 시위에 나서 \‘트럼프타워\’와 \‘트럼프인터내셔널호텔\’ 등까지 행진했다. 맨해튼에서 옷집을 경영하는 그렉 심슨은 “트럼프의 당선을 받아들일 수 없어 상점 문을 닫고 시위에 동참했다”며 “어제부터 트럼프를 뽑은 손님은 받지 않겠다고 밝혔다”고 전했다. 현지 경찰은 트럼프 관련 건물 근처에 바리케이드와 콘크리트벽을 설치하고 시위대의 접근을 막았으나 일부 시위대는 담을 넘어 전진하기도 했다. 워싱턴DC에서도 수백명이 최근 개장한 트럼프인터내셔널호텔까지 행진하며 “트럼프는 물러나라”고 외쳤다. 경찰 당국은 반트럼프 시위는 주말로 가면서 격화할 것으로 보고 있다.';
      refineText(text, callback);
    });
  }
};
