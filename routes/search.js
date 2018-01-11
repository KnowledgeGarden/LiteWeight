/**
 * @author park 
 * 
 */
var express = require('express');
var router = express.Router();
var helper = require('./helper');
var constants = require('../apps/constants');
var SearchModel = require('../apps/models/search_model');

const numToShow = 100;

router.get('/searchhits/', helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req),
        creatorId = req.session.theUserId,
        offset = 0; // for paging
        query = req.query.srch_term;
    SearchModel.search(creatorId, query, offset, numToShow, function(hits) {
        data.hitlist = hits;
        return res.render('searchhits_index', data);
    });

});


module.exports = router;
