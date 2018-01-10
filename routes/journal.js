/* @author park */
var express = require('express');
var router = express.Router();
var constants = require('../apps/constants');
var JournalModel = require('../apps/models/journal_model');
var ChannelModel = require('../apps/models/channel_model');
var helper = require('./helper');


/**
 * Here, we are working on a User DM channel
 */
router.get('/fromuser/:id', helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req),
        creatorId = req.session.theUserId;
        id = req.params.id; // the DM id
    console.log("Journal.fromuser",id);
 //   ChannelModel.fetch(creatorId, id, function(err, node) {
 //       var pvt = node.isPrivate;
 //       if (pvt) {
 //           pvt = 'true';
 //       } else {
  //          pvt = 'false';
 //       }
        data.formtitle = "New Journal Entry";
        data.action = "/journal/newfromuser";
        data.hidden_1 = id; 
        data.hidden_2 = creatorId;
        console.log("Journal.fromuser-1",data);
        return res.render('newnode_form', data);
    //});
});

/**
 * This must pay attention to the privacy setting on the channel
 */
router.get('/fromchannel/:id', helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req),
        creatorId = req.session.theUserId;
        id = req.params.id;
    console.log("Journal.fromchannel",id);
    ChannelModel.fetchChannel(creatorId, id, function(err, node) {
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


router.get('/new', helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req)
    data.formtitle = "New Journal Entry";
    data.action = "/journal/newnode";
    data.checkPrivate = true;
    data.private = "";
    return res.render('newnode_form', data);
});

router.get('/:id', helper.isPrivate, function(req, res, next) {
    var id = req.params.id,
        creatorId = req.session.theUserId;
    JournalModel.fetchJournal(creatorId, id, function(err, result) {
        if (err) {  // issue of a private node somewhere in the tree -- should not happen
            req.flash("error", err);
            return res.redirect("/");
        } else {
 
            req.session.curCon = result.id;
            var data = helper.startData(req);
            console.log("Model returned "+result);
            data.result = result;
        return res.render('view', data);
        }
    });
});

router.post('/newnode', helper.isPrivate, function(req, res, next) {
    var title = req.body.title
        details = req.body.details,
        isPrivate = req.body.private,
        isPrivate = (isPrivate === 'true');
        creatorId = req.session.theUserId;
    JournalModel.createJournalEntry(creatorId, title, details, isPrivate, function(err, entry) {
        console.log("Journal.post.newnode",entry);
        return res.redirect("/journal/"+entry.id);
    });
});

router.post('/newfromuser', helper.isPrivate, function(req, res, next) {
    var title = req.body.title
        details = req.body.details,
        isPrivate = true;
        channelId = req.body.hidden_1;
        creatorId = req.session.theUserId;
    JournalModel.createJournalFromDM(creatorId, channelId, title, details, isPrivate, function(err, entry) {
        console.log("Journal.post.newfromuser",entry);
        return res.redirect("/journal/"+entry.id);
    });
});
router.post('/newfromchannel', helper.isPrivate, function(req, res, next) {
    var title = req.body.title
        details = req.body.details,
        isPrivate = req.body.private,
        isPrivate = (isPrivate === 'true');
        channelId = req.body.hidden_1;
        creatorId = req.session.theUserId;
    JournalModel.createJournalFromChannel(creatorId, channelId, title, details, isPrivate, function(err, entry) {
        console.log("Journal.post.newfromchannel",entry);
        return res.redirect("/journal/"+entry.id);
    });
});

module.exports = router;