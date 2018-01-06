var express = require('express');
var router = express.Router();
var constants = require('../apps/constants');
var ConversationModel = require('../apps/models/conversation_model');
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
router.get('/jstree/:id', function(req, res, next) {
    var data = helper.startData(req),
    id = req.params.id;
    data.ajaxid = id;
    return res.render('jstree', data);
});

/**
 * Paint the tree by ajax call
 */
router.get('/ajaxtree/:id', function (req, res, next) {
    var id = req.params.id;
    ConversationModel.toJsTree(id, null, function(tree) {
    //    console.log("Convo.jstree",id,tree);
        return res.json(tree);
    });

});

/**
router.get("/conversationindex", helper.isPrivate, function(req, res, next) {
    req.session.curCon = null;
    var data = helper.startData(req);
    var nd = ConversationModel.listConversations();
    //list conversations: 
    data.conlist = nd;

    res.render("conversation_index", data);
});
router.get("/newconversation", function(req, res, next) {
    console.log("New Conversation");
    var data = helper.startData(req);
    data.hidden_1 = constants.CONVERSATION_NODE_TYPE;
    return res.render("newconversation_form", data);
});

router.get("/fetchconversation/:id", function(req, res, next) {
    var data = helper.startData(req),
        id = req.params.id;
    console.log("FetchingCon",id);
    ConversationModel.fetchConversation(id, function(result) {
        console.log("Model returned "+result);
        req.session.curCon = result.rootNode.id;
        data.result = result;
        data.img = "/images/ibis/map.png";
        data.rootimg = typeToLargeImage(result.rootNode.type);
        data.rootnode = result.rootNode;
        return res.render('view_conversation', data);
    });
});
*/

router.get("/newquestion/:id", function(req, res, next) {
    var data = helper.startData(req),
        id = req.params.id;
    console.log("NewQuestion",id);
    ConversationModel.fetchView(id, function(err, parent) {
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

router.get("/newanswer/:id", function(req, res, next) {
    var data = helper.startData(req),
        id = req.params.id;
    console.log("NewAnswer",id);
    ConversationModel.fetchView(id, function(err, parent) {
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

router.get("/newpro/:id", function(req, res, next) {
    var data = helper.startData(req),
        id = req.params.id;
    console.log("NewPro",id);
    ConversationModel.fetchView(id, function(err, parent) {
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

router.get("/newcon/:id", function(req, res, next) {
    var data = helper.startData(req),
        id = req.params.id;
    console.log("NewCon",id);
    ConversationModel.fetchView(id, function(err, parent) {
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

router.get("/newnote/:id", function(req, res, next) {
    var data = helper.startData(req),
        id = req.params.id;
    console.log("NewNote",id);
    ConversationModel.fetchView(id, function(err, parent) {
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

router.get("/newreference/:id", function(req, res, next) {
    var data = helper.startData(req),
        id = req.params.id;
    console.log("NewReference",id);
    ConversationModel.fetchView(id, function(err, parent) {
        data.respondimg = parent.imgsm;
        data.respondlabel = parent.statement;
        data.responddetails = parent.details;
        data.hidden_1 = id;
        data.hidden_2 = constants.REFERENCE_NODE_TYPE;
        data.formtitle = "New Reference Node";
        data.action = "/conversation/newnode"
        data.checkPrivate = true;
        data.private = "";
        return res.render('newnode_form', data);
    });
});

/**
 * Get any node other than conversation and tag
 */
router.get("/:id", function(req, res, next) {
    var data = helper.startData(req),
        id = req.params.id;
    console.log("Fetching ",id);
    ConversationModel.fetchView(id, function(err, result) {
        console.log("Model returned "+result);
        data.result = result;
        return res.render('view', data);
    });
    
});

/**
 * Fundamentally handles all kinds of nodes
 * TODO: make tags go to a tag router
 */
router.post("/newnode", function(req, res, next) {
    var title = req.body.title
        details = req.body.details,
        isPrivate = req.body.private,
        isPrivate = (isPrivate === 'true');
        parentId = req.body.hidden_1,
        type = req.body.hidden_2,
        creatorId = req.session.theUser;
    //TODO
    console.log("NN", JSON.stringify(req.body));
    ConversationModel.newResponseNode(creatorId, parentId, type, title, details, isPrivate, function(err, node) {
        res.redirect(node.id);
    });
 
});

/*
 // Creates a new conversation node as well as its root node
router.post("/newconversation", function(req, res, next) {
    console.log("XXXX",JSON.stringify(req.body));
    var title = req.body.title
        details = req.body.details,
        type = req.body.hidden_1,
        roottitle = req.body.roottitle,
        rootdetails = req.body.rootdetails,
        creatorId = req.session.theUser;
    console.log("PostNewCon", type,title,details,  roottitle, rootdetails);
    ConversationModel.newConversation(creatorId, title, details, type, roottitle, rootdetails, function(id) {
        return res.redirect("/conversation/"+id);
    });
});
*/

module.exports = router;