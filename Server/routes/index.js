var express = require('express');
var router = express.Router();
var read = require('node-readability');
var jaccard = require('multiset-jaccard');
var mecab = require('mecab-ya');
var textrank = require('textrank-node');
var ranker = new textrank();
var async = require('async');


/* 리팩토링 1. 텍스트를 문장/ 문단으로 분리 2. 그래프를 얻는다 3. 텍스트랭크 돌린다.
 파싱한 텍스트 다듬기
1. () 와 안의 내용물은 제거한다
2. 온점 없는 문장은 제거한다. => 개행문자로 분리 , 온점 없으면 삭제. 필터링
3.
*/
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
    console.log(result);
    callback(null, result);
  });
}


// 이건 하나의 문단 (문장들의 배열) 안에서 그래프를 구하는 것임
function getGraph (lines, callback) {
  var graph = [];
  // 1st para in async.each() is the array of items
  async.eachSeries(lines, function(leftLine, finishLeft){
      // Call an asynchronous function, often a save() to DB
      var sentenceSimilarity = [];
      mecab.nouns(leftLine, function(err, leftNouns) {
        async.eachSeries(lines, function(rightLine, finishRight) {
          mecab.nouns(rightLine, function(err, rightNouns) {
            if(leftNouns === undefined)
            { leftNouns = [""]; }
            if(rightNouns === undefined)
            { rightNouns = [""]; }

            jaccard.index(leftNouns, rightNouns, function(err, index) {
              sentenceSimilarity.push(index);
              finishRight();
            });
          });
        }, function(err) {
          graph.push(sentenceSimilarity);
          finishLeft();
        });
      });
    },
    // 3rd param is the function to call when everything's done
    function(err){
      callback(err, graph);
    }
  );
}

function getSelectedLines(lines, selectedIndex, callback){
  // 문장의 순서대로 정렬하는 게 문맥상 자연스러운 듯.
  async.sortBy(selectedIndex, function(x, callback) {
    callback(null, x);
  }, function(err, sortedIndex) {
    var result = [];
    for(var i = 0; i < 3; i++){
      for(var j = 0; j < lines.length; j++){
        if(sortedIndex[i] === j){
          result[i] = lines[j];
        }
      }
    }
    callback(result);
  });
}

function getSelectedIndex(textRank, max) {
  if(textRank.length === 0){
    return [0];
  }
  var selectedIndex = [];

  for(var i = 0; i < max&& i < textRank.length; i++){
    selectedIndex[i] = textRank.length - (i+1); // 매번 같은 인덱스를 기본으로 두면 문제가 생김.
    for(var j = 0; j < textRank.length; j++){
      if(textRank[selectedIndex[i]] < textRank[j]){
        if(!selectedIndex.includes(j)){
          selectedIndex[i] = j;
        }
      }
    }
  }
  return selectedIndex;
}


router.get('/hello', function (req, res, next) {
  read(req.headers.pageurl, function(err, article, meta) {

    var text = "";
    if(req.headers.pageurl.includes("news.naver")){
      var dom = article.document;
      //<br> 사이에 있는 것들만 각각 문단으로 가져오게 하기
      text = dom.getElementById("articleBodyContents").textContent;
    }
    else{
      text = article.textBody;
    }
    console.log(text);
    //var lines = splitToSentences(text);
    refineText(text, function(lines) {
        getGraph(lines, function(err, graph) {
          // 그래프를 얻었으니 텍스트랭크를 돌린다.
          var Rank = ranker.getTextRank(graph).probabilityNodes;
          // 가장 영향력이 큰 노드 세 개를 취한다.
          var selectedIndex = getSelectedIndex(Rank, 3);
          getSelectedLines(lines, selectedIndex, function(result){
            return res.json({shorten: result});
          });
        });
    });
  });
});

module.exports = router;


/*
router.get('/hello', function (req, res, next) {
  read(req.headers.pageurl, function(err, article, meta) {

    var text = "";
    if(req.headers.pageurl.includes("news.naver")){
      var dom = article.document;
      text = dom.getElementById("articleBodyContents").textContent;
    }
    else{
      text = article.textBody;
    }

    // 시도 1 :각 문단에서 3개 이하를 추출하고 그 안에서 다시 세개를 고른다.
    //var lines = splitToSentences(text);
    refineText(text, function(refinedParagraphs) {
      var rankedParagraphs = [];
      async.eachSeries(refinedParagraphs, function(lines, endEach){
        getGraph(lines, function(err, graph) {
          // 그래프를 얻었으니 텍스트랭크를 돌린다.
          var Rank = ranker.getTextRank(graph).probabilityNodes;
          // 가장 영향력이 큰 노드 세 개를 취한다.
          var selectedIndex = getSelectedIndex(Rank, 3);
          // 문장의 순서대로 정렬하는 게 문맥상 자연스러운 듯.
          async.sortBy(selectedIndex, function(x, callback) {
            callback(null, x);
          }, function(err, sortedIndex) {
            var result = [];

            for(var i = 0; i < 3; i++){
              for(var j = 0; j < lines.length; j++){
                if(sortedIndex[i] === j){
                  result[i] = lines[j];
                }
              }
            }
            rankedParagraphs.push(result);
            endEach();
          });
        });
      }, function(err) {
        console.log(rankedParagraphs);
        return res.json({shorten: [ 'no', 'nothing', 'cando']});
        //return res.json({ shorten : result });
      });
    });
  });
});

*/
//text = '도널드 트럼프가 미국 대통령에 당선된 직후 불붙은 반(反)트럼프 시위가 극에 달하고 있다. 9일 워싱턴DC와 뉴욕에서 시작된 시위가 10일 버지니아와 매사추세츠, 일리노이, 텍사스, 캘리포니아 등의 50여 도시로 확산됐다. 시위에 고교생이 참여하고 화염병이 등장하는 등 과격해지고 있다. 로스앤젤레스에서는 도로를 점거한 시위대 20여명이, 오클랜드에서는 경찰에 화염병 등을 던진 시위대 30여명이 체포됐다. 전날 뉴욕에서 붙잡힌 65명을 포함하면 이날까지 200여명이 연행됐다. 샌프란시스코에서는 고교생 1000여명이 시위에 참가하는 등 시위대 상당수는 대학생과 히스패닉, 흑인, 무슬림 등 트럼프의 성·인종·종교 차별 언행에 피해를 받았다고 주장하는 이들이라고 CNN 등이 보도했다. 특히 트럼프 당선자가 거주하는 뉴욕 맨해튼은 수천명이 시위에 나서 \‘트럼프타워\’와 \‘트럼프인터내셔널호텔\’ 등까지 행진했다. 맨해튼에서 옷집을 경영하는 그렉 심슨은 “트럼프의 당선을 받아들일 수 없어 상점 문을 닫고 시위에 동참했다”며 “어제부터 트럼프를 뽑은 손님은 받지 않겠다고 밝혔다”고 전했다. 현지 경찰은 트럼프 관련 건물 근처에 바리케이드와 콘크리트벽을 설치하고 시위대의 접근을 막았으나 일부 시위대는 담을 넘어 전진하기도 했다. 워싱턴DC에서도 수백명이 최근 개장한 트럼프인터내셔널호텔까지 행진하며 “트럼프는 물러나라”고 외쳤다. 경찰 당국은 반트럼프 시위는 주말로 가면서 격화할 것으로 보고 있다.';

//text = '대의(代議)민주주의란 시민의 의사를 국회의원들이 위임받아 의사당에서 표현하는 제도다. 의원들은 헌법의 주인인 시민의 대리인일 뿐이다. 탄핵은 시민이 대통령에게 위임한 권한을 회수할 최후의 수단이고, 촛불집회를 통해 분출된 시민의 분노와 기대를 수렴하는 일은 국회의원에게 주어진 헌법적 책무다. 포항남·울릉의 한 시민이 공개질의서를 통해 “우리 지역 국회의원은 박 대통령 탄핵에 대한 입장이 무엇인지 분명히 밝혀달라”고 요구한 것은 의미심장하다. 그는 “대통령 탄핵은 국가 중대사이고 지역 유권자들의 관심이 지극히 높은 문제”라면서 “탄핵에 대한 의원의 입장이 어떠한지 유권자로서 지역민들은 알권리가 있다”고 했다. 당연한 요구다. 이런 움직임이 다른 지역에도 확산돼야 한다. 시민들은 자신의 심부름꾼에게 민의의 수행을 요구하고, 이를 정직하게 이행할 의지가 있는지 물을 자격과 권리가 있다. 새누리당 의원들은 헌법기관으로서, 시민의 대리인으로서 자신의 입장을 분명하게 밝혀야 한다. 그리고 시민의 뜻을 받든다는 생각으로 당당하게 탄핵에 임해야 한다. 이것이 시민의 명령이다.';
