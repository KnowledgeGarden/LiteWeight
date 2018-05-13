/**
 * @author park 
 * Session values used
 *  req.session.theUser = handle
 *  req.session.theUserId = userId
 *  req.session.theUserEmail = email
 */
var express = require('express');
var router = express.Router();
var helper = require('./helper');
var constants = require('../apps/constants');
var EventModel = require('../apps/models/eventlog_model');
var CommonModel = require('../apps/models/common_model');
var AdminModel = require('../apps/models/admin_model');
const numRecentsToShow = 100;


/* GET home page. */
router.get('/', helper.isPrivate, function(req, res, next) {
  var userId = req.session.theUserId;
  req.session.curCon = null;

//  console.log("Home",req.session);
  EventModel.listRecentEvents(userId, numRecentsToShow, function(events) {
    var data = helper.startData(req);
    data.recentlist = events;    
    return res.render('index', data);
  });
});

/**
 * Face it: this platform passes around nodes of all sorts, and it's
 * non-trivial to know how to paint them. So, here we are. A hack.
 * This is expensive, given the multiple fetch of a node.
 * TODO: revise this to make use of that fetched node in painting
 */
router.get('/grab/:id', helper.isPrivate, function(req, res, next) {
  var id = req.params.id,
    creatorId = req.session.theUserId;
  CommonModel.fetchNode(creatorId, id, function(err, node) {
    if (err) {  // issue of a private node somewhere in the tree -- should not happen
      req.flash("error", err);
      return res.redirect("/");
    } else {
      var type = node.type;
      if (node.isProCon) {
        return res.redirect('/procon/'+id);
      } else if (type === constants.BOOKMARK_NODE_TYPE) {
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


router.get('/signup', function(req, res, next) {
  helper.checkIP(req, "login", "signup");
  var data = helper.startData(req);
  return res.render("signup_form", data);
});

router.get('/login', function(req, res, next) {
  helper.checkIP(req, "login");
  var data = helper.startData(req);
  return res.render("login_form", data);
});

router.get('/logout', function(req, res, next) {
  var struct = {};
  req.session.theUser = null;
  req.session.theUserId = null;
 
  struct.type = constants.LOGOUT_EVENT;
  struct.content = req.session.theUserId;
  EventModel.registerSimpleEvent(struct, function(err) {
    helper.logout(req);
    return res.redirect('/');
  });
});

router.get("/aboutbookmarks", function(req, res, next) {
  var data = helper.startData(req);
  return res.render("about_bookmarks", data);
});
router.get("/aboutconnections", function(req, res, nex) {
  var data = helper.startData(req);
  return res.render("about_connections", data);
});
router.get("/aboutjournals", function(req, res, nex) {
  var data = helper.startData(req);
  return res.render("about_journal", data);
});
router.get("/aboutconversations", function(req, res, nex) {
  var data = helper.startData(req);
  return res.render("about_conversations", data);
});
router.get("/abouttags", function(req, res, nex) {
  var data = helper.startData(req);
  return res.render("about_tags", data);
});
router.get("/aboutdbpedia", function(req, res, nex) {
  var data = helper.startData(req);
  return res.render("about_dbpedia", data);
});
router.get("/aboutcarrotsearch", function(req, res, nex) {
  var data = helper.startData(req);
  return res.render("about_carrotsearch", data);
});
router.get("/aboutgeomap", function(req, res, nex) {
  var data = helper.startData(req);
  return res.render("about_geomap", data);
});
router.get("/aboutchannels", function(req, res, nex) {
  var data = helper.startData(req);
  return res.render("about_channels", data);
});
router.get("/aboutparticipants", function(req, res, nex) {
  var data = helper.startData(req);
  return res.render("about_participants", data);
});
router.get("/aboutremember", function(req, res, nex) {
  var data = helper.startData(req);
  return res.render("about_remember", data);
});
router.get("/about", helper.isPrivate, function(req, res, nex) {
  var data = helper.startData(req);
  return res.render("about", data);
});
router.get("/contact", helper.isPrivate, function(req, res, nex) {
  var data = helper.startData(req);
  return res.render("contact", data);
});

router.post('/signup', function(req, res, next) {
  var data = helper.startData(req);
      email = req.body.email,
      handle = req.body.handle,
      fullName = req.body.fullname,
      pwd = req.body.password;
  AdminModel.signup(email, handle, fullName, pwd, function(err) {
    console.log("Index.post",email,err);
    if (!err) {
      var struct = {};
      struct.type = constants.SIGNUP_EVENT;
      struct.email = email;
      EventModel.registerSimpleEvent(struct, function(err) {
        console.log("Index.post-1",err);
        return res.redirect('/');
      });
    } else {
      console.log("Index.post-2");
      req.flash("error", "Signup Problem: "+err);
      return res.redirect('/');       
    }
  });
  
});

router.post('/login', function(req, res, next) {
  var email = req.body.email,
      password = req.body.password,
      ip =  helper.checkIP(req, "login", "signup");
  AdminModel.authenticate(email, password, function(err, truth, handle, userId) {
    if (err) {
      req.flash("error", err);
    }
    if (truth) {
      req.session.theUser = handle;
      req.session.theUserId = userId;
      req.session.theUserEmail = email;
      var struct = {};
      struct.type = constants.LOGIN_EVENT;
      struct.email = email;
      EventModel.registerSimpleEvent(struct, function(err) {
        return res.redirect('/');
      });
    } else {
      //log to history.json the failed login attempt
      //NOTE: this does put the password out in text
      var struct = {};
      struct.type = constants.LOGIN_FAIL_EVENT;
      struct.email = email;
      struct.password = password;
      EventModel.registerSimpleEvent(struct, function(err) {
        return res.redirect('/');
      });
    }
  });
});
module.exports = router;
