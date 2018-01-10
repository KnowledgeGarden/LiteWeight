/**
 * @author park
 * A route for node editing
 */
var express = require('express');
var router = express.Router();
var helper = require('./helper');
var constants = require('../apps/constants');
var CommonModel = require('../apps/models/common_model');

/////////////////////////////////
// Node Edit Policy
//  In general, given that this is a conversation-based platform,
//      Any node (except tags) can be edited in anyway, with 
//      a exceptions:
//
//  * If the node has child nodes of the conversation (IBIS) type,
//      then the statement (Label) cannot change owing to the possibility
//      of changing the semantics of that node's subtree.
//
//  * A node can *only* be edited by its owner, or an admin
//
// In fact, there is an issue which relates to Optimistic Locking:
//  It is possible that at the same time someone clicks the Edit Node
//  button, someone else could be adding an IBIS response.
//  This -- when optimistic locking is implemented -- fill fire an error
//  and, in theory, roll back the latest edit.
//  However, given optimistic locking is not implemented, one scenario is that
//  the IBIS response will make no sense.
//     That's a case for Delete Node
////////////////////////////////



/**
 * We are here because canEdit passed in the original
 * view and an edit link was followed. Still, should
 * validate canEdit
 */
router.get('/edit/:id', function(req, res, next) {
    var data = helper.startData(req),
    creatorId = req.session.theUserId;
    id = req.params.id;
    CommonModel.fetchNode(creatorId, id, function(err, node) {
        if (err) { // private node case
            req.flash("error", constants.INSUFFICIENT_CREDENTIALS);
            return res.redirect("/");    
        } else if (helpers.canEdit(creatorId, node)) {
            var hasIbisKids = CommonModel.hasIBISChildren(node);
            var label = node.statement;
            if (hasIbisKids) {
                label = "Label cannot be edited";
            }
            data.hidden_2 = node.version;
            data.hidden_1 = node.id;
            data.url = node.url;
            data.formlabel = label;
            data.formdetails = node.details;
            data.formtitle = "Edit Node";
            data.action = "/edit/edit";
            return res.render('newnode_form', data);
        } else { //not owner case
            //flash a message and paint the node again
            req.flash("error", constants.INSUFFICIENT_CREDENTIALS);
            return res.redirect("/grag/"+id);    
        }
    });
});

router.post('/edit', function(req, res, next) {
    var json = req.body,
        creatorId = req.session.theUserId;
        id = req.body.hidden_1;
    CommonModel.updateNode(creatorId, body, function(err) {
        if (err) {
            req.flash("error", constants.INSUFFICIENT_CREDENTIALS);
        }
        return res.redirect("/grab/"+id);
    });
});

module.exports = router;