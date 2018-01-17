/* @author park */
var express = require('express');
var router = express.Router();
var helper = require('./helper');
var constants = require('../apps/constants');
var ChannelModel = require('../apps/models/channel_model');
var BookmarkModel = require('../apps/models/bookmark_model');
var UserModel = require('../apps/models/user_model');


/* GET home page. */
router.get('/', helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req),
    creatorId = req.session.theUserId;
    data.channellist = ChannelModel.listChannels(creatorId);
    data.userlist = UserModel.listUsers(creatorId);
    //add a mock entry to solve a CSS issue with Firefox
    var mock = {};
    var l = [];
    var journ = {};
    journ.id="";
    journ.img="";
    journ.statement="";
    l.push(mock);
    data.journallist = l;

    console.log("Channels.index",data);
    return res.render('channel_view', data);
});

/**
 * Someone wants to make a new Channel
 */
router.get("/new", helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req);
    data.private = "";

    return res.render('newchannel_form', data);
});


/**
 * Fetch the contents of a channel.
 */
router.get('/:id', helper.isPrivate, function(req, res, next) {
    var id = req.params.id,
        data = helper.startData(req),
        creatorId = req.session.theUserId;

    console.log("Channels.getChannel",id);
    ChannelModel.fetchChannel(creatorId, id, function(err, result) {
        // all channels except bookmarks get their entry from journals
        var clist = result.theJournals;
        if (!clist) {
            clist = result.theBookmarks;
            //TODO history channel will get its clist by listing recents
        }
        if (!clist) {
            clist = [];
        }
        // bookmarks only get their entries from the bookmark model
        //WE do not paint an EditMe node in Bookmarks:
        // new nodes only come from the bookmarklt
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
        data.userlist = UserModel.listUsers(creatorId);
        return res.render('channel_view', data);
    });
});

router.post('/new', helper.isPrivate, function(req, res, next) {
    var title = req.body.title
        isPrivate = req.body.private,
        isPrivate = (isPrivate === 'true'),
        members = req.body.members,
        creatorId = req.session.theUserId,
        handle =  req.session.theUser;
        console.log("XYZ",req.body);
        console.log("Channels.post.new",isPrivate,members,title);
    ChannelModel.createChannel(creatorId, handle, title, members, isPrivate, function(err, node) {
        return res.redirect('/channels');
    });
});


module.exports = router;
