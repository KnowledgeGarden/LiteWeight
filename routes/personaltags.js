/* @author park */
var express = require('express');
var router = express.Router();
var constants = require('../apps/constants');
var helper = require('./helper');
var PersonalTagModel = require('../apps/models/personaltag_model');

router.get('/tagcluster', helper.isPrivate, function(req, res, next) {
    var  data = helper.startData(req);
    data.action = "/personaltags/tagclusterajax";
    return res.render('tagcluster_view', data);
});

router.get('/tagclusterajax', function(req, res, next) {
    var creatorId = req.session.theUserId;
    console.log("PersonalTags.get.tagclusterajax",creatorId);
    PersonalTagModel.clusterTags(creatorId, function(json) {
        console.log("PersonalTags.get.tagclusterajax-1",json);
        return res.json(json);
    });
});
router.get("/tagindex", helper.isPrivate, function(req, res, next) {
    req.session.curCon = null;
    var data = helper.startData(req),
        creatorId = req.session.theUserId;
    data.taglist = PersonalTagModel.listTags(creatorId);
    return res.render('tag_index', data);
});

router.get("/newtag/:id", helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req),
        creatorId = req.session.theUserId,
        id = req.params.id;
    console.log("PersonalNewTag",id);
    data.hidden_1 = id;
    data.taglist = PersonalTagModel.listTags(creatorId);
    data.action = "/personaltags/newnode";

   return res.render('newtag_form', data);
});

router.get("/gettag/:id", helper.isPrivate, function(req, res, next) {
    var id = req.params.id,
        creatorId = req.session.theUserId,
        data = helper.startData(req);
    //console.log("Tags.getTag",id);
    PersonalTagModel.fetchTag(creatorId, id, function(err, result) {
        data.result = result;
        console.log("PersonalTags.getTag",result);
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
    PersonalTagModel.addTags(creatorId, handle, label, selections, parentId, function(err, type) {
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