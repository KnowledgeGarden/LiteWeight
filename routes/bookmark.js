/* @author park */

// Web clips -- user enters annotation
// javascript:location.href='http://localhost:3000/bookmark/new?url='+
//     encodeURIComponent(location.href)+'&title='+ encodeURIComponent(document.title)
// Stash a bookmark without any editing -- very quick
// javascript:location.href='http://localhost:3000/bookmark/stash?url='+
//     encodeURIComponent(location.href)+'&title='+ encodeURIComponent(document.title)


var express = require('express');
var router = express.Router();
var constants = require('../apps/constants');
var BookmarkModel = require('../apps/models/bookmark_model');
var helper = require('./helper');

//Bookmarks is not an app: it's a Channel
router.get('/stash', function(req, res, next) {
    var data = helper.startData(req),
        query = req.query,
        creatorId = req.session.theUser;
    //Must be logged in
    if (!creatorId) {
        return res.render("login_form", data);
    }
    if (query.url) {
        console.log("Bookmark.stash", query);
        BookmarkModel.stashBookmark(creatorId, query.url, query.title, function(err, node) {
            return res.redirect(query.url);
        });
    }
    // else ignore it
});
/**
 * Paint a bookmark form
 */
router.get('/new', function(req, res, next) {
    var data = helper.startData(req),
        query = req.query,
        creatorId = req.session.theUser;
    //Must be logged in
    if (!creatorId) {
        return res.render("login_form", data);
    }
    
    data.formtitle = "New Bookmark";
    data.formlabel = query.title;
    data.url = query.url;
    data.checkPrivate = true;
    data.private = "";
    data.action = "/bookmark/newnode";
    if (query.url) {
    //        console.log("NB", eq.body);
        BookmarkModel.newBookmark(creatorId, url, statement, details, isPrivate, function(err, node) {
            return res.redirect('/bookmark/'+node.id);
        });
    } else {
        //That's not good!
        req.flash("error", "Missing URL");
        return res.redirect("/");
    }
});
    

/**
 * Fetch and paint a bookmark
 */
router.get("/:id", function(req, res, next) {
    var id = req.params.id;
//    console.log("Bookmark.get",id);
    BookmarkModel.fetchBookmark(id, function(err, result) {
        req.session.curCon = result.id;
        var data = helper.startData(req);
        console.log("Model returned "+result);
        data.result = result;
        return res.render('view', data);
    });
});


router.post("/newnode", function(req, res, next) {
    var statement = req.body.title
        details = req.body.details,
        isPrivate = req.body.private,
        isPrivate = (isPrivate === 'true');
        url = req.body.url,
        creatorId = req.session.theUser; //constants.TEST_CREATOR; //ToDo
    if (url) {
//        console.log("NB", eq.body);
        BookmarkModel.newBookmark(creatorId, url, statement, details, isPrivate, function(err, node) {
            return res.redirect('/bookmark/'+node.id);
        });
    } else {
        //That's not good!
        req.flash("error", "Missing URL");
        return res.redirect("/");
    }
 
});

module.exports = router;