var express = require('express');
var router = express.Router();
var helper = require('./helper');

router.get('/dbpedia', helper.isPrivate, function(req, res, next) {
    return res.render('dbpedia', helper.startData(req));
});

module.exports = router;