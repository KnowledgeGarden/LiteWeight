/* @author park */
var express = require('express');
var router = express.Router();
var constants = require('../apps/constants');
var helper = require('./helper');
var TagModel = require('../apps/models/tag_model');

router.get('/tagcluster', helper.isPrivate, function(req, res, next) {
    var  data = helper.startData(req);
    data.action = "/tags/tagclusterajax";
    return res.render('tagcluster_view', data);
});

router.get('/tagclusterajax', function(req, res, next) {
    var creatorId = req.session.theUserId;
    TagModel.clusterTags(creatorId, function(json) {
        console.log("Tags.get.tagclusterajax",json);
        return res.json(json);
    });
});
router.get("/tagindex", helper.isPrivate, function(req, res, next) {
    req.session.curCon = null;
    var data = helper.startData(req),
        creatorId = req.session.theUserId;
    data.taglist = TagModel.listTags(creatorId);
    return res.render('tag_index', data);
});

router.get("/newtag/:id", helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req),
        creatorId = req.session.theUserId,
        id = req.params.id;
    console.log("NewTag",id);
    data.hidden_1 = id;
    data.taglist = TagModel.listTags(creatorId);
    data.action = "/tags/newnode";

   return res.render('newtag_form', data);
});

router.get("/gettag/:id", helper.isPrivate, function(req, res, next) {
    var id = req.params.id,
        creatorId = req.session.theUserId,
        data = helper.startData(req);
    //console.log("Tags.getTag",id);
    TagModel.fetchTag(creatorId, id, function(err, result) {
        req.session.curSel = result.id;
        data.result = result;
        console.log("Tags.getTag",result);
        return res.render('tag_view', data);
    });
});

/**
 * Add tags to some node
 */
router.post("/newnode", helper.isPrivate, function(req, res, next) {
    var label = req.body.title
        selections = req.body.selectedtags,
        parentId = req.body.hidden_1,
        creatorId = req.session.theUserId,
        handle =  req.session.theUser;
    console.log("NT",req.body);
    TagModel.addTags(creatorId, handle, label, selections, parentId, function(err, type) {
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
        } else { 
              //TODO MUST add other redirects if other apps added
            return res.redirect('/conversation/'+parentId);
        }
    });
});



module.exports = router;