/* @author park */
var express = require('express');
var router = express.Router();
var constants = require('../apps/constants');
var InboxModel = require('../apps/models/inbox_model');
var CommonModel = require('../apps/models/common_model');
var helper = require('./helper');


/**
 * This is a mirror of index.grab except we remove the node from this user's inbox
 */
router.get('/fetch/:id', helper.isPrivate, function(req, res, next) {
    var id = req.params.id,
    creatorId = req.session.theUserId;
    InboxModel.removeLink(creatorId, id, function(err) {
        CommonModel.fetchNode(creatorId, id, function(err, node) {
            if (err) {  // issue of a private node somewhere in the tree -- should not happen
            req.flash("error", err);
            return res.redirect("/");
            } else {
            var type = node.type;
            if (type === constants.BOOKMARK_NODE_TYPE) {
                return res.redirect('/bookmark/'+id);
            } else if (type === constants.TAG_NODE_TYPE) {
                return res.redirect('/tags/gettag/'+id);
            } else if (type === constants.PERSONAL_TAG_NODE_TYPE) {
                return res.redirect('/personaltags/gettag/'+id);
            } else if (type === constants.RELATION_NODE_TYPE) {
                return res.redirect('/connections/'+id);
            } else if (type === constants.BLOG_NODE_TYPE) {
                return res.redirect('/journal/'+id);
            } else if (type === constants.CHANNEL_NODE_TYPE) {
                return res.redirect('/channels/'+id);
            } else { // pick up all the conversation nodes
                return res.redirect('/conversation/'+id);
            }
            }
        });
    });
});

// get this user's Inbox
router.get('/:id', helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req),
    id = req.params.id;
    data.inboxlist = InboxModel.listMyInboxNotices(id);
    data.userId = id;
    
    return res.render('inbox', data);
});

module.exports = router;