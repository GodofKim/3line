var jaccard = require('multiset-jaccard');
var mecab = require('mecab-ya');
var textrank = require('textrank-node');
var ranker = new textrank();
var async = require('async');
var pagerank = require('pagerank-js');


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


module.exports = {
  summarize: function(lines, callback){
    getGraph(lines, function(err, graph){
      pagerank(graph, 0.85, 0.0001, function (err, result) {
        if (err) throw new Error(err);
        console.log(result);
        var selectedIndex = getSelectedIndex(result, 3);
        getSelectedLines(lines, selectedIndex, callback);
      });
      //var Rank = ranker.getTextRank(graph).probabilityNodes;

    });
  }
};
