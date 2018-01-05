var express = require('express');
var router = express.Router();
var constants = require('../apps/constants');
var helper = require('./helper');
var TagModel = require('../apps/models/tag_model');

router.get("/tagindex", helper.isPrivate, function(req, res, next) {
    req.session.curCon = null;
    var data = helper.startData(req);
    data.taglist = TagModel.listTags();
    res.render('tag_index', data);
});

router.get("/newtag/:id", function(req, res, next) {
    var data = helper.startData(req),
        id = req.params.id;
    console.log("NewTag",id);
    data.hidden_1 = id;
    data.taglist = TagModel.listTags();

   return res.render('newtag_form', data);
});

router.get("/gettag/:id", function(req, res, next) {
    var id = req.params.id,
        data = helper.startData(req);
    console.log("Tags.getTag",id);
    TagModel.fetchTag(id, function(err, result) {
        data.result = result;
        return res.render('tag_view', data);
    });
});

/**
 * Add tags to some node
 */
router.post("/newnode", function(req, res, next) {
    var label = req.body.title
        selections = req.body.selectedtags,
        parentId = req.body.hidden_1,
        creatorId = req.session.theUser;
    console.log("NT",req.body);
    TagModel.addTags(creatorId, label, selections, parentId, function(err, type) {
        // "type" because we don't know what kind of node was just tagged
        // here, we are using redirects; could just mimic their route renders
        // but then have to do all the fetching, etc
        console.log("Tags.newnode",parentId,type);
        if (type === constants.BOOKMARK_NODE_TYPE) {
            return res.redirect('/bookmark/'+parentId);
        } else if (type === constants.RELATION_NODE_TYPE) {
            return res.redirect('/connections/'+parentId);
        } else if (type === constants.BLOG_NODE_TYPE) {
            return res.redirect('/journal/'+parentId);
        } else if (type === constants.CONVERSATION_NODE_TYPE) {
            return res.redirect('/conversation/fetchconversation/'+parentId);
        } else { 
              //TODO MUST add other redirects if other apps added
            return res.redirect('/conversation/'+parentId);
        }
    });
});



module.exports = router;