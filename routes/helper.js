/* @author park */
var config = require('../config/config');
var Helper,
    instance;

Helper = function() {
    var self = this;
    //console.log("HELPER");

    self.isPrivate = function (req, res, next) {
        if (config.isPrivatePortal) {
            if (self.isAuthenticated(req)) {
                return next();
            }
            return res.redirect("/login");
        } else {
            return next();
        }
    };

    /**
     * Prefill a JSONObject with data for rendering
     * @return
     */
    self.startData = function(req) {
//        console.log("Helper.startData",req.session);
        var title = config.brand;
        var result = { title: title };
        if (req.flash) {
            result.flashMsg = req.flash("error") || req.flash("success");
        }
        if (self.isAuthenticated(req)) {
            result.isAuthenticated = true;
        }
        result.invitationOnly = config.invitationOnly;
        //current conversation
        result.curCon = req.session.curCon;
        //remembered
        result.isRemembered = req.session.transclude;
//        console.log("XYZ-2",req.session.curCon,req.session.theUser);
        return result;
    };

    /**
     * This will be extended to ask if user is an admin
     * @param {*} userId 
     * @param {*} node 
     */
    self.canEdit = function(userId, node) {
        return (userId === node.creatorId);
    };
    
    self.isAuthenticated = function(req) {
//        console.log("Helper.isAuthenticated",req.session);
        if (req.session.theUser) {
            return true;
        }
        return false;
    };

    self.logout = function(req) {
        //DO NOTHING FOR NOW
        req.session.theUser = null;
    };

};
instance = new Helper();
module.exports = instance;