/* @author park */
var express = require('express');
var router = express.Router();
var constants = require('../apps/constants');
var ConversationModel = require('../apps/models/conversation_model');
var CommonModel = require('../apps/models/common_model');
var helper = require('./helper');

function typeToLargeImage(type) {
    var result = "/images/ibis/map.png"; // default
    if (type === constants.QUESTION_NODE_TYPE) {
        result = "/images/ibis/issue.png";
    } else if (type === constants.ANSWER_NODE_TYPE) {
        result = "/images/ibis/position.png";
    } else if (type === constants.PRO_NODE_TYPE) {
        result = "/images/ibis/plus.png";
    } else if (type === constants.CON_NODE_TYPE) {
        result = "/images/ibis/minus.png";
    } else if (type === constants.NOTE_NODE_TYPE) {
        result = "/images/ibis/note.png";
    } else if (type === constants.REFERENCE_NODE_TYPE) {
        result = "/images/ibis/reference.png";
    } else if (type === constants.DECISION_NODE_TYPE) {
        result = "/images/ibis/decision.png";
    } else if (type === constants.TAG_NODE_TYPE) {
        result = "/images/tag.png";
    }

    return result;
}

/**
 * Paint the tree view: ViewFirst
 * The view uses ajax to fetch the tree
 */
router.get('/jstree/:id', helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req),
    id = req.params.id;
    data.ajaxid = id;
    return res.render('jstree', data);
});

/**
 * Paint the tree by ajax call
 */
router.get('/ajaxtree', helper.isPrivate, function (req, res, next) {
    var id =  req.session.curCon,
        curSel = null, //req.session.curSel; Turnng this off for now: it doesn't work
        creatorId = req.session.theUserId;
    ConversationModel.toJsTree(creatorId, id, null, curSel, function(err, tree) {
       // console.log("Convo.jstree",id,JSON.stringify(tree));
        if (err) {  // issue of a private node somewhere in the tree -- should not happen
            req.flash("error", err);
            return res.redirect("/");
        } else {
            return res.json(tree);
        }
    });
});


router.get("/newquestion/:id", helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req),
        creatorId = req.session.theUserId,
        id = req.params.id;
    console.log("NewQuestion",id);
    ConversationModel.fetchView(creatorId, id, function(err, parent) {
        data.respondimg = parent.imgsm;
        data.respondlabel = parent.statement;
        data.responddetails = parent.details;

        data.hidden_1 = id;
        data.hidden_2 = constants.QUESTION_NODE_TYPE;
        data.formtitle = "New Question Node";
        data.action = "/conversation/newnode";
        data.checkPrivate = true;
        data.private = "";
        return res.render('newnode_form', data);
    });
});

router.get("/newanswer/:id", helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req),
        creatorId = req.session.theUserId,
        id = req.params.id;
    console.log("NewAnswer",id);
    ConversationModel.fetchView(creatorId, id, function(err, parent) {
        data.respondimg = parent.imgsm;
        data.respondlabel = parent.statement;
        data.responddetails = parent.details;
        data.hidden_1 = id;
        data.hidden_2 = constants.ANSWER_NODE_TYPE;
        data.formtitle = "New Answer Node";
        data.action = "/conversation/newnode";
        data.checkPrivate = true;
        data.private = "";
        return res.render('newnode_form', data);
    });
});

router.get("/newpro/:id", helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req),
        creatorId = req.session.theUserId,
        id = req.params.id;
    console.log("NewPro",id);
    ConversationModel.fetchView(creatorId, id, function(err, parent) {
        data.respondimg = parent.imgsm;
        data.respondlabel = parent.statement;
        data.responddetails = parent.details;
        data.hidden_1 = id;
        data.hidden_2 = constants.PRO_NODE_TYPE;
        data.formtitle = "New Pro Argument Node";
        data.action = "/conversation/newnode";
        data.checkPrivate = true;
        data.private = "";
        return res.render('newnode_form', data);
    });
});

router.get("/newcon/:id", helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req),
        creatorId = req.session.theUserId,
        id = req.params.id;
    console.log("NewCon",id);
    ConversationModel.fetchView(creatorId, id, function(err, parent) {
        data.respondimg = parent.imgsm;
        data.respondlabel = parent.statement;
        data.responddetails = parent.details;
        data.hidden_1 = id;
        data.hidden_2 = constants.CON_NODE_TYPE;
        data.formtitle = "New Con Argument Node";
        data.action = "/conversation/newnode";
        data.checkPrivate = true;
        data.private = "";
        return res.render('newnode_form', data);
    });
});

router.get("/newnote/:id", helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req),
        creatorId = req.session.theUserId,
        id = req.params.id;
    console.log("NewNote",id);
    ConversationModel.fetchView(creatorId, id, function(err, parent) {
        data.respondimg = parent.imgsm;
        data.respondlabel = parent.statement;
        data.responddetails = parent.details;
        data.hidden_1 = id;
        data.checkPrivate = true;
        data.private = "";
        data.hidden_2 = constants.NOTE_NODE_TYPE;
        data.formtitle = "New Note Node";
        data.action = "/conversation/newnode";
        return res.render('newnode_form', data);
    });
});

router.get("/newreference/:id", helper.isPrivate, function(req, res, next) {
    var data = helper.startData(req),
        creatorId = req.session.theUserId,
        id = req.params.id;
    console.log("NewReference",id);
    ConversationModel.fetchView(creatorId, id, function(err, parent) {
        data.respondimg = parent.imgsm;
        data.respondlabel = parent.statement;
        data.responddetails = parent.details;
        data.url = " ";
        data.hidden_1 = id;
        data.hidden_2 = constants.REFERENCE_NODE_TYPE;
        data.formtitle = "New Reference Node";
        data.action = "/conversation/newnode"
        data.checkPrivate = true;
        data.private = "";
        return res.render('newnode_form', data);
    });
});

router.get('/edit/:id', function(req, res, next) {
    var data = helper.startData(req),
        creatorId = req.session.theUserId;
        id = req.params.id;
    console.log("Conversation.get.edit",id);
    ConversationModel.fetchView(creatorId, id, function(err, result) {
        if (err) {  // issue of a private node somewhere in the tree -- should not happen
            req.flash("error", err);
            return res.redirect("/");
        } else {
            data.hidden_1 = id;
            data.url = result.url;
            data.formlabel = result.statement;
            data.formdetails = result.details;
            data.formtitle = "Edit This Node";
            data.action = "/conversation/editnode"
            return res.render('newnode_form', data);
        }
    });
});
/**
 * Get any node other than conversation and tag
 */
router.get("/:id", helper.isPrivate, function(req, res, next) {
    var creatorId = req.session.theUserId,
        id = req.params.id;
    console.log("Fetching ",id);
    ConversationModel.fetchView(creatorId, id, function(err, result) {
        console.log("Model returned "+result);
        req.session.curCon = result.context;
        req.session.curSel = result.id;
        var data = helper.startData(req);
        if (err) { // credential issue
            req.flash("error", err);
            return res.redirect("/");
        } else {
            var canEdit = helper.canEdit(creatorId, result);
            data.canEdit = canEdit;
            data.canDelete = helper.canDelete(creatorId, result);
            data.editURL = "/conversation/edit/"+id;
            data.result = result;
            if (result.isProCon) {
                return res.render('procon_view', data);
            } else {
                return res.render('view', data);
            }
        }
    });
    
});

router.get('/delete/:id', helper.isPrivate, function(req, res, next) {
    var creatorId = req.session.theUserId,
        id = req.params.id;
    ConversationModel.deleteNode(creatorId, id, function(err) {
        console.log("Conversations.delete",id, err);
        return res.redirect('/');
    });
});


router.post('/editnode', helper.isPrivate, function(req, res, next) {
    var body = req.body,
        creatorId = req.session.theUserId,
        handle =  req.session.theUser;
    CommonModel.updateNode(creatorId, handle, body, function(err) {
        console.log("Conversation.post.newnode",err);
        return res.redirect("/conversation/"+body.hidden_1);
    });
});
/**
 * Fundamentally handles all kinds of nodes
 * TODO: make tags go to a tag router
 */
router.post("/newnode", helper.isPrivate, function(req, res, next) {
    var title = req.body.title
        details = req.body.details,
        isPrivate = req.body.private,
        isPrivate = (isPrivate === 'true');
        parentId = req.body.hidden_1,
        type = req.body.hidden_2,
        url = req.body.url,
        creatorId = req.session.theUserId,
        handle = req.session.theUser;
    console.log("NN", JSON.stringify(req.body));
    ConversationModel.newResponseNode(creatorId, handle, parentId, type, title, details, url, isPrivate, function(err, node) {
        return res.redirect(node.id);
    });
 
});

module.exports = router;