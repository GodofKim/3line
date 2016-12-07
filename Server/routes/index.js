var express = require('express');
var router = express.Router();
var readability = require('../readability');
var summarize = require('../summarize');

router.get('/hello', function (req, res, next) {
  readability.refine(req.headers.pageurl, function(lines) {
    summarize.summarize(lines, function(summarized){
      return res.json({ shorten: summarized});
    });
  });
});

      });
    });
  });
});

module.exports = router;
