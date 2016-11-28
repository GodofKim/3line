var express = require('express');
var router = express.Router();
var read = require('node-readability');
var jaccard = require('multiset-jaccard');
var mecab = require('mecab-ya');
var textrank = require('textrank-node');
var ranker = new textrank();
var async = require('async');

/* GET home page. */
router.get('/', function(req, res, next) {


  read(req.headers.pageurl, function(err, article, meta) {
    console.log(article.content);
  });

  var sentences = ranker.splitToSentences(text);
  var graph = [];
  // 1st para in async.each() is the array of items
  async.each(sentences,
    // 2nd param is the function that each item is passed to
    function(sentence, callback){
      // Call an asynchronous function, often a save() to DB
      var sentenceSimilarity = [];

      async.each(sentences, function(sentence_2, callback_2) {
        mecab.nouns(sentence, function(err, result) {
          mecab.nouns(sentence_2, function(err, result_2) {
            var index = jaccard.index(result, result_2);
            sentenceSimilarity.push(index);
            callback_2();
          });
        });
      },
      function(err) {
        graph.push(sentenceSimilarity);
        callback();
      });
    },
    // 3rd param is the function to call when everything's done
    function(err){
      // 그래프를 얻었으니 텍스트랭크를 돌린다.
      var Rank = ranker.getTextRank(graph).probabilityNodes;
      // 가장 영향력이 큰 노드 세 개를 취한다.
      var selectedIndex = ranker.getSelectedIndex(Rank, 3);
      // 문장의 순서대로 정렬하는 게 문맥상 자연스러운 듯.
      selectedIndex.sort();
      var result = [];
      for(var i = 0; i < 3; i++){
        for(var j = 0; j < sentences.length; j++){
          if(selectedIndex[i] === j){
            result[i] = sentences[j];
          }
        }
      }

      return res.json({ shorten : result });
    }
  );


});

function getSelectedIndex(textRank, max) {
  var selectedIndex = [];
  for(var i = 0; i < max; i++){
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
      text = dom.getElementById("articleBodyContents").textContent;
    }
    else{
      text = article.textBody;
    }

    var lines = ranker.splitToSentences(text);
    var graph = [];
    // 1st para in async.each() is the array of items
    async.eachSeries(lines, function(leftLine, finishLeft){
        // Call an asynchronous function, often a save() to DB
        var sentenceSimilarity = [];

        mecab.nouns(leftLine, function(err, leftNouns) {
          async.eachSeries(lines, function(rightLine, finishRight) {
            mecab.nouns(rightLine, function(err, rightNouns) {
              if(leftNouns === undefined)
                leftNouns = [];
              if(rightNouns === undefined)
                rightNouns = [];

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
          return res.json({ shorten : result });
        });
      }
    );
  });
});

module.exports = router;
