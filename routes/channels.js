var express = require('express');
var router = express.Router();
var helper = require('./helper');
var constants = require('../apps/constants');
var ChannelModel = require('../apps/models/channel_model');
var BookmarkModel = require('../apps/models/bookmark_model');


/* GET home page. */
//TODO this belongs in index.js along with its homepage get
router.get('/', helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req),
    creatorId = req.session.theUser;
    data.channellist = ChannelModel.listChannels(creatorId);
    console.log("Channels.index",data);
    return res.render('channel_view', data);
});

router.get("/new", function(req, res, next) {
    var data = helper.startData(req);
    data.private = "";
    data.checkPrivate = true;
    return res.render('newchannel_form', data);
});

/** handled in journal.js
router.get('/newjournal/:id', function(req, res, next) {
    var id = req.params.id,
        data = helper.startData(req);
    console.log("Channels.newJournal",id);
    //Must check the privacy settings on this channel
    ChannelModel.fetchChannel(id, function(err, node) {

    })
    return res.redirect("/"); //TODO
});
*/

/**
 * Fetch the contents of a channel.
 * All channels get their content from journals
 * except 'bookmarks'
 */
router.get('/:id', function(req, res, next) {
    var id = req.params.id,
        data = helper.startData(req),
        creatorId = req.session.theUser;

    console.log("Channels.getChannel",id);
    ChannelModel.fetchChannel(id, function(err, result) {
        var clist = result.journals;
        if (!clist) {
            clist = result.bookmarks;
        }
        if (!clist) {
            clist = [];
        }
        // bookmarks only get their entries from the bookmark model
        if (id !== 'bookmarks') {
            if (helper.isAuthenticated(req)) {
                var newentry = {};
                newentry.id = "/fromchannel/"+result.id;
                newentry.type = constants.BLOG_NODE_TYPE;
                newentry.img = "/images/publication_sm.png";
                newentry.statement = "Edit Me!";
                clist.push(newentry);
            }
        }
        //latest on top
        clist = clist.reverse();
        data.journallist = clist;
        data.channelid = result.id;
        data.channellist = ChannelModel.listChannels(creatorId);

        return res.render('channel_view', data);
    });
});

router.post('/new', function(req, res, next) {
    var title = req.body.title
        isPrivate = req.body.private,
        isPrivate = (isPrivate === 'true');
        members = req.body.members;
        creatorId = req.session.theUser;
    ChannelModel.createChannel(creatorId, title, members, isPrivate, function(err, node) {
        return res.redirect('/channels');
    });
});


module.exports = router;
