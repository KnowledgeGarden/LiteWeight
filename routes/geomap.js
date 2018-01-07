/* @author park */
var express = require('express');
var router = express.Router();
var helper = require('./helper');

router.get('/geomap', helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req);
    //NOTE, we can create a GeoMap model to control map initialization;
    // here we hard wire some values
    data.x = "30.0";
    data.y = "5.0";
    data.z = "2"; //zoom smaller is further out
    return res.render('geomap', data);
});

module.exports = router;









 