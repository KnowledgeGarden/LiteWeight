var express = require('express');
var router = express.Router();
var helper = require('./helper');

/* GET users listing. */
router.get('/', helper.isPrivate, function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
