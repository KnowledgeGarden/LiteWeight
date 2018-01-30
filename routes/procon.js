/* @author park */
var express = require('express');
var router = express.Router();
var constants = require('../apps/constants');
var helper = require('./helper');
var ConversationModel = require('../apps/models/conversation_model');
var JournalModel = require('../apps/models/journal_model');

router.get('/:id', helper.isPrivate, function(req, res, next) {
    var id = req.params.id,
        creatorId = req.session.theUserId;
    JournalModel.fetchJournal(creatorId, id, function(err, result) {
        if (err) {  // issue of a private node somewhere in the tree -- should not happen
            req.flash("error", err);
            return res.redirect("/");
        } else {
            var canEdit = helper.canEdit(creatorId, result);
 
            req.session.curCon = result.id;
            req.session.curSel = result.id;
            var data = helper.startData(req);
            console.log("Model returned "+result);
            data.canEdit = canEdit;
            data.editURL = "/journal/edit/"+id;
            data.result = result;
            return res.render('procon_view', data);
        }
    });
});

router.get('/newpro/:id', helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req),
    creatorId = req.session.theUserId,
    id = req.params.id;
    console.log("NewPro",id);
    ConversationModel.fetchView(creatorId, id, function(err, parent) {
        data.respondimg = parent.imgsm;
        data.respondlabel = parent.statement;
        data.responddetails = parent.details;
        data.hidden_1 = id;
        data.hidden_2 = constants.PRO_NODE_TYPE;
        data.formtitle = "New Pro Argument Node";
        data.action = "/conversation/newnode";
        data.checkPrivate = true;
        data.url = " ";
        data.private = "";
        return res.render('newnode_form', data);
    });
});

router.get('/newcon/:id', helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req),
        creatorId = req.session.theUserId,
        id = req.params.id;
    console.log("NewCon",id);
    ConversationModel.fetchView(creatorId, id, function(err, parent) {
        data.respondimg = parent.imgsm;
        data.respondlabel = parent.statement;
        data.responddetails = parent.details;
        data.hidden_1 = id;
        data.hidden_2 = constants.CON_NODE_TYPE;
        data.formtitle = "New Con Argument Node";
        data.action = "/conversation/newnode";
        data.checkPrivate = true;
        data.url = " ";
        data.private = "";
        return res.render('newnode_form', data);
    });
});

module.exports = router;