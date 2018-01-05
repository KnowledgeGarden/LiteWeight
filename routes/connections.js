/**
 * We are using req.session.transclude to save remembered node identities.
 * This serves node transclusion and node connections
 */
var express = require('express');
var router = express.Router();
var constants = require('../apps/constants');
var ConnectionModel = require('../apps/models/connection_model');
var helper = require('./helper');


/**
 * Called from connections.hbs partial which has two buttons.
 * Present UX calls for a user to<br>
 * 1- Remember a node
 * 2- Visit another node
 * 3- Make a decision which button to push.
 * A- Push the Target button means the visited node is the target
 *  and remembered node is source
 * B- Push the Source button means the visited node is the source
 *  and remembered node is target
 */
router.get('/newassource/:id/:type', function(req, res, next) {
    var id = req.params.id,
        type = req.params.type,
        remembered = req.session.transclude;
    json = helper.startData(req);
    if (!id && !remembered) {
        req.flash("error", "Both Source and Target cannot be undefined");
        return res.redirect("/");
    }
    if (!remembered) {
        req.flash("error", "Missing remembered topic");
        return res.redirect("/");
    }
    
    json.source = id;
    json.target = remembered;
    json.callerId = id;
    json.callerType = type;
    json.checkPrivate = true;
    json.isPrivate = "";
    return res.render("connection_form", json);
});

router.get('/newastarget/:id/:type', function(req, res, next) {
    var id = req.params.id,
        type = req.params.type,
        remembered = req.session.transclude;
    json = helper.startData(req);
    if (!id && !remembered) {
        req.flash("error", "Both Source and Target cannot be undefined");
        return res.redirect("/");
    }
    if (!remembered) {
        req.flash("error", "Missing remembered topic");
        return res.redirect("/");
    }
    
    json.source = remembered;
    json.target = id;
    json.callerId = id;
    json.callerType = type;
    json.checkPrivate = true;
    json.isPrivate = "";
    return res.render("connection_form", json);
});

router.get('/remember/:id', function(req, res, next) {
    var id = req.params.id;
    req.session.transclude = id;
    console.log("Connections.get.remember",id);
    //TODO
    return res.redirect('/');
});

router.get('/connectionindex', helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req);
    data.connectionlist = ConnectionModel.listConnections();
    return res.render("connection_index", data);
});

router.get('/:id', function(req, res, next) {
    var id = req.params.id,
        data = helper.startData(req),
        isAuth = data.isAuthenticated;
    ConnectionModel.fetchConnection(id, function(err, data) {
        //odd unresolved bug: isAuthenticated disappears during fetch
        data.isAuthenticated = isAuth;
        console.log("Connections.get",data.isAuthenticated);
        data.isRelation = true;
        data.result = data;
        return res.render('view',data);
    });

});


/**
 * Called from connection_form.hbs
 */
router.post('/new', function(req, res, next) {
    var body = req.body,
        callerId = body.callerId,
        type = body.callerType;
        creatorId = req.session.theUser;
    console.log("Connections.post.net",ConnectionModel,body);
    ConnectionModel.createConnection(creatorId, body, function(err) {
        console.log("Connections.post.new",err);
        req.session.transclude = null;
        //TODO make this redirect to the caller
        return res.redirect('/');
    });
});


module.exports = router;