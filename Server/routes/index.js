var express = require('express');
var router = express.Router();
var readability = require('../readability');
var summarize = require('../summarize');

router.get('/hello', function (req, res, next) {
  readability.getText(req.headers.pageurl, function(title, article){
    readability.refine(article, function(refinedText){
      summarize.summarize(refinedText, function(summarized){
        var content = {
          title: title,
          shorten: summarized
        };
        console.log(content);
        return res.json(content);
      });
    });
  });
});

module.exports = router;
