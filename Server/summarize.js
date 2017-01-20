var jaccard = require('multiset-jaccard');
var mecab = require('mecab-ya');
var textranker = require('textranker');
var async = require('async');


// 이건 하나의 문단 (문장들의 배열) 안에서 그래프를 구하는 것임
function getGraph (lines, callback) {
  var graph = [];
  var nodes = [];
  // 각 문장에서 명사를 추출하여 노드 n개 생성
  async.eachSeries(lines, function(line, finish){
    setTimeout(function() {
      mecab.nouns(line, function(err, nouns){
        if(nouns === undefined){
          nouns = [""];
        }
        nodes.push(nouns);
        finish();
      });
    }, 0);
  }, function(err){
    // 유사도를 측정하여 그래프 생성
    var similarity = [];
    async.eachSeries(nodes, function(leftNode, finishLeft){
      setTimeout(function() {
        async.eachSeries(nodes, function(rightNode, finishRight){
          jaccard.index(leftNode, rightNode, function(err, index){
            similarity.push(index);
            finishRight();
          });
        }, function(err){
          if(err) throw err;
          graph.push(similarity);
          similarity = [];
          finishLeft();
        });
      }, 0);
    }, function(err){
      callback(err,graph);
    });
  });
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
      console.log("getGraph finish");
      textranker(graph, 0.85, 0.0001, function(result){
        // 에러 처리를 안 했네
        var selectedIndex = getSelectedIndex(result, 3);
        getSelectedLines(lines, selectedIndex, callback);
      });
    });
  }
};
