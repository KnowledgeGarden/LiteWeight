var express = require('express');
var router = express.Router();
var constants = require('../apps/constants');
var JournalModel = require('../apps/models/journal_model');
var ChannelModel = require('../apps/models/channel_model');
var helper = require('./helper');

router.get("/journalindex", helper.isPrivate, function(req, res, next) {
    req.session.curCon = null;
    var data = helper.startData(req);
    data.journallist = JournalModel.listJournalEntries();
    res.render('journal_index', data);
});

/**
 * This must pay attention to the privacy setting on the channel
 */
router.get('/fromchannel/:id', function(req, res, next) {
    var data = helper.startData(req),
        id = req.params.id;
    console.log("Journal.fromchannel",id);
    ChannelModel.fetchChannel(id, function(err, node) {
        var pvt = node.isPrivate;
        if (pvt) {
            pvt = 'true';
        } else {
            pvt = 'false';
        }
        data.formtitle = "New Journal Entry";
        data.action = "/journal/newfromchannel";
        data.hidden_1 = id;
        data.checkPrivate = false;
        // journal entries follow the privacy settings on their channels
        data.private = pvt;
        console.log("Journal.fromchannel-1",data);
        return res.render('newnode_form', data);
    });
});

router.get('/new', function(req, res, next) {
    var data = helper.startData(req)
    data.formtitle = "New Journal Entry";
    data.action = "/journal/newnode";
    data.checkPrivate = true;
    data.private = "";
    return res.render('newnode_form', data);
});

router.get('/:id', function(req, res, next) {
    var data = helper.startData(req),
        id = req.params.id;
//    console.log("Bookmark.get",id);
    JournalModel.fetchJournal(id, function(err, result) {
        req.session.curCon = result.id;
        console.log("Model returned "+result);
        data.result = result;
        return res.render('view', data);
    });
});

router.post('/newnode', function(req, res, next) {
    var title = req.body.title
        details = req.body.details,
        isPrivate = req.body.private,
        isPrivate = (isPrivate === 'true');
        creatorId = req.session.theUser;
    JournalModel.createJournalEntry(creatorId, title, details, isPrivate, function(err, entry) {
        console.log("Journal.post.newnode",entry);
        return res.redirect("/journal/"+entry.id);
    });
});

router.post('/newfromchannel', function(req, res, next) {
    var title = req.body.title
        details = req.body.details,
        isPrivate = req.body.private,
        isPrivate = (isPrivate === 'true');
        channelId = req.body.hidden_1;
        creatorId = req.session.theUser;
    JournalModel.createJournalFromChannel(creatorId, channelId, title, details, isPrivate, function(err, entry) {
        console.log("Journal.post.newfromchannel",entry);
        return res.redirect("/journal/"+entry.id);
    });
});

module.exports = router;