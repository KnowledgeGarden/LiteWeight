/* @author park */
var Database = require('../drivers/file_database_driver');
var CommonModel;
var UserModel;
var constants = require('../constants');
var Inbox,
    instance;

Inbox = function() {
    var self = this;

    self.inject = function(commModel, usrModel) {
        CommonModel = commModel;
        UserModel = usrModel;
    };



    /**
     * This serves follows and DMs where userId is available
     * @param {String} userId 
     * @param {String} nodeId 
     * @param {*} callback err
     */
    self.acceptLink = function(userId, nodeId, callback) {
        UserModel.fetchUserView(userId, userId, function(err, user) {
            var ins = user.inbox;
            if (!ins) {
                ins = [];
            }
            ins.push(nodeId);
            user.inbox = ins;
            user.version = CommonModel.newId();
            Database.saveUserData(userId, user, function(err) {
                return callback(err);
            });
        });

    };

    /**
     * This accepts @mentions
     * It requires a Database.findByHandle method
     * @param {String} userHandle 
     * @param {String} nodeId 
     * @param {*} callback err
     */
    self.acceptHandleLink = function(userHandle, nodeId, callback) {
        var usr = Database.fetchUserByHandle(userHandle);
        console.log("InboxModel.acceptHandleLink",userHandle,usr);
        if (usr) {
            var ins = usr.inbox;
            if (!ins) {
                ins = [];
            }
            ins.push(nodeId);
            usr.inbox = ins;
            usr.version = CommonModel.newId();
            Database.saveUserData(usr.id, usr, function(err) {
                return callback(err);
            });
        } else {
            //Technically speaking, we should toss a bitch: user not found by handle
            return callback(null);
        }
       
    };

    ///////////////////////////////////
    // Interesting issue with InBox:
    //  How does the rest of the system know when to call removeLink?
    // It seems a sad reality that anytime someone clicks on a link, this has to be called
    //  even if the user has an empty inbox
    // HAH! NO. If all inbox fetches are routed through the inbox router, it does the deletes!!!
    // Problem solved.
    ///////////////////////////////////
    /**
     * 
     * @param {*} userId 
     * @param {*} nodeId 
     * @param {*} callback err
     */
    self.removeLink = function(userId, nodeId, callback) {
        UserModel.fetchUserView(userId, userId, function(err, user) {
            var ins = user.inbox;
            if (ins) {
                var where = ins.indexOf(nodeId);
                if (where > -1) {
                    ins.splice(where,1);
                    user.inbox = ins;
                    user.theInbox = null;
                    Database.saveUserData(userId, user, function(err) {
                        return callback(err);
                    }); 
                } else {
                    return callback(null);
                }
            } else {
                return callback(null);
            }
        });

    };

    /**
     * 
     * @param {*} userId 
     * @param {*} callback 
     */
    self.listMyInboxNotices = function(userId) {
        var result = [];
        UserModel.fetchUserView(userId, userId, function(err, user) {
            var ins = user.theInbox;
            if (ins) {
                ins.forEach(function(struct) {
                    result.push(struct);
                });
            }
            return result
        });
        
    };
};

if (!instance) {
    instance = new Inbox();
}
module.exports = instance;