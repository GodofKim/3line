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

  var text = "박근혜 대통령과 새누리당 친박 지도부가 도널드 트럼프의 미국 대통령 당선을 계기로 정국 반전을 꾀하고 있다. 이른바 ‘트럼프 리스크’를 부각하며 내부가 분열하면 난국을 헤쳐갈 수 없다고 바람잡이에 나선 것이다. 박 대통령은 어제 트럼프 당선자와의 통화에서 그의 방한을 요청하며 “만나기를 고대한다”고 말했다. 이정현 새누리당 대표는 박 대통령이 군통수권도 총리에게 넘겨야 한다는 문재인 전 민주당 대표의 발언을 반헌법적인 발상이라고 역공했다. 새누리당은 또 간담회 등을 개최하면서 ‘트럼프 비상체제’를 내세우고 있다. 박 대통령과 친박 지도부가 트럼프 문제를 내세워 위기를 덮으려는 것이다.";

  var sentences = ranker.splitToSentences(text);
  var graph = new Array();
  // 1st para in async.each() is the array of items
  async.each(sentences,
    // 2nd param is the function that each item is passed to
    function(sentence, callback){
      // Call an asynchronous function, often a save() to DB
      var sentenceSimilarity = new Array();

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
      var result = '';
      for(var i = 0; i < 3; i++){
        for(var j = 0; j < sentences.length; j++){
          if(selectedIndex[i] === j){
            result += sentences[j] + ' ';
          }
        }
      }

      return res.render('index', { title: result });
    }
  );


});


module.exports = router;
