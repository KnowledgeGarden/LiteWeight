/* @author park */
var express = require('express');
var router = express.Router();
var helper = require('./helper');
var constants = require('../apps/constants');
var UserModel = require('../apps/models/user_model');
var ChannelModel = require('../apps/models/channel_model');


/**
 * Fetch a particular user object (id).
 * How it is handled depends on who is asking (creatorId).
 * If they are different, then this is a DM from creatorId to id
 *    They get their own channel by way of a new Journal Entry
 * If they are the same, that user gets to see all his Journal conversations
 * In any case, this returns the equivalent of that channel
 */
router.get('/:id', helper.isPrivate, function(req, res, next) {
    var id = req.params.id,
        creatorId = req.session.theUserId;
    UserModel.processUserGet(creatorId, id, function(err, result) {
        console.log("Users.get",id,result);
      var data = helper.startData(req);
      var clist = result.theJournals;
      if (!clist) {
          clist = [];
      }
      //if (id !== creatorId) {
          var newentry = {};
          newentry.id = "/fromuser/"+result.id;
          newentry.type = constants.BLOG_NODE_TYPE;
          newentry.img = "/images/publication_sm.png";
          newentry.statement = "Edit Me!";
          clist.push(newentry);
      //}
      //latest on top
      clist = clist.reverse();
      data.journallist = clist;
      data.channelid = result.id;
      data.channellist = ChannelModel.listChannels(creatorId);
      data.userlist = UserModel.listUsers(creatorId);
      return res.render('channel_view', data);
    });
});

module.exports = router;
