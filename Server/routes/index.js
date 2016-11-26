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

  var text = '【서울=뉴시스】독일 정부의 포용정책이 고맙다는 이유로 앙겔라 메르켈 총리의 이름을 따른 시리아 여아와 그 가족의 망명 신청이 거부됐다. 25일(현지시간) 미국 CNN 등에 따르면 독일 서부 노르트라인베스트팔렌주 묀헨글라트바흐에 사는 시리아 출신 마몬 알함자(27)와 테마 알하와(21) 부부와 이들의 딸인 11개월된 앙겔라 메르켈은  독일 이민난민청(BAMF)로부터 망명 신청이 거부됐다는 통보를 받았다. 시리아 아기 메르켈 가족. (사진출처: CNN) 2016.11.26 【서울=뉴시스】문예성 기자 = 독일 정부의 포용정책이 고맙다는 이유로 앙겔라 메르켈 총리의 이름을 따른 시리아 여아와 그 가족의 망명 신청이 거부됐다.  25일(현지시간) 미국 CNN 등에 따르면 독일 서부 노르트라인베스트팔렌주 묀헨글라트바흐에 사는 시리아 출신 마몬 알함자(27)와 테마 알하와(21) 부부와 이들의 딸인 11개월된 앙겔라 메르켈은  독일 이민난민청(BAMF)로부터 망명 신청이 거부됐다는 통보를 받았다.  다만 이들 가족에게는 보완적 보호 (Subsidiary Protection) 조치가 내려졌다. 보완적 보호란 망명 신청이 거부된 이들을 추방으로부터 보호하는 법적 조치로, 이 지위가 부여된 이들은 1년 동안 독일 체류가 가능하고 추가로 2년까지 연장가능하다.  메르켈의 아빠 알함자는 언론에 "우리에게 망명기회를 주지 않기로 한 법원의 결정에 충격을 받았다"면서 "이런 결정해 항의할 예정"이라고 밝혔다.  한편 난민 유입 사태가 걷잡을 수 없이 확산하면서 난민 문제가 유럽연합(EU)의 최대 난제로 떠올랐다. 메르켈 정부 역시 난민 위기와 이주민 문제로 고심하고 있다.';

  var text2 = '도널드 트럼프가 미국 대통령에 당선된 직후 불붙은 반(反)트럼프 시위가 극에 달하고 있다. 9일 워싱턴DC와 뉴욕에서 시작된 시위가 10일 버지니아와 매사추세츠, 일리노이, 텍사스, 캘리포니아 등의 50여 도시로 확산됐다. 시위에 고교생이 참여하고 화염병이 등장하는 등 과격해지고 있다. 로스앤젤레스에서는 도로를 점거한 시위대 20여명이, 오클랜드에서는 경찰에 화염병 등을 던진 시위대 30여명이 체포됐다. 전날 뉴욕에서 붙잡힌 65명을 포함하면 이날까지 200여명이 연행됐다. 샌프란시스코에서는 고교생 1000여명이 시위에 참가하는 등 시위대 상당수는 대학생과 히스패닉, 흑인, 무슬림 등 트럼프의 성·인종·종교 차별 언행에 피해를 받았다고 주장하는 이들이라고 CNN 등이 보도했다. 특히 트럼프 당선자가 거주하는 뉴욕 맨해튼은 수천명이 시위에 나서 \‘트럼프타워\’와 \‘트럼프인터내셔널호텔\’ 등까지 행진했다. 맨해튼에서 옷집을 경영하는 그렉 심슨은 “트럼프의 당선을 받아들일 수 없어 상점 문을 닫고 시위에 동참했다”며 “어제부터 트럼프를 뽑은 손님은 받지 않겠다고 밝혔다”고 전했다. 현지 경찰은 트럼프 관련 건물 근처에 바리케이드와 콘크리트벽을 설치하고 시위대의 접근을 막았으나 일부 시위대는 담을 넘어 전진하기도 했다. 워싱턴DC에서도 수백명이 최근 개장한 트럼프인터내셔널호텔까지 행진하며 “트럼프는 물러나라”고 외쳤다. 경찰 당국은 반트럼프 시위는 주말로 가면서 격화할 것으로 보고 있다.';

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

router.get('/hello', function (req, res, next) {
  console.log(req.headers);

  read(req.headers.pageurl, function(err, article, meta) {
    console.log(article.content);
    return res.json({ shorten: [req.headers.pageurl, "this is", "Awesome"] });
  });
});

module.exports = router;
