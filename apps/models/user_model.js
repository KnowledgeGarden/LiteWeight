/* 
 * @author park
 * A user database object uses:
 *  nodes, theNodes for what this user creates
 *  inbox, theInbox for inbox
 */
var constants = require('../constants');
var Database = require('../drivers/file_database_driver');
var CommonModel;
var User,
    instance;

User = function() {
    var self = this;

    self.inject = function(commModel) {
        CommonModel = commModel;
        //console.log("JournalModel",this);        
    };

    /**
     * Returns a populated userObject
     * @param {*} userId 
     * @param {*} id 
     * @param {*} callback err, data
     */
    self.fetchUserView = function(userId, id, callback) {
        console.log("UserModel.fetchUserView",id);
       
        Database.fetchUser(id, function(err, data) {
            console.log("UserModel.fetchUserView-1",err, data);
            if (err) {
                console.log("UserModel.fetchUserView-2");
                return callback(err, null);
            }
            else if (data) {
                CommonModel.populateNode(userId, data, function(result) {
                    console.log("UserModel.fetchUserView-3",err,result);
                    return callback(err, result);
                });
                  
            } else {
                console.log("UserModel.fetchUserView-4");
                return callback(null, null);
            }
        })
    };

    /**
     * Returns the user object without populating it
     * @param {*} userId 
     * @param {*} id 
     * @param {*} callback 
     */
    self.fetchUser = function(userId, id, callback) {
        console.log("UserModel.fetchUser",id);
       
        Database.fetchUser(id, function(err, data) {
            if (err) {
                return callback(err, null);
            }
            else if (data) {
                  return callback(err, data);
            } else {
                return callback(null, null);
            }
        })
    };
    
    /////////////////////////////////////////////////
    // Direct Messaging among two users.
    // If several users want to be in a group, they create a private channel.
    // This is just about one-on-one between two users.
    // --If a user is in DM with another, user sees all channel interactions shared
    //  by the pair, with a DM named e.g. "userid_otherid" in /data/user/dm/.
    //  They are both working in that DM
    // --If a user is viewing OWN DM, named "userid" in /data/user/dm/
    //  That channel if for personal, private musings
    /////////////////////////////////////////////////
    // What makes this messy is that All Journal, etc, forms land elsewhere, not here.
    // JournalModel and ConversationModel cannot know about what's going on here;
    //  they just behave according to the privacy profile of what they see.
    // Perhaps:
    //  Some kind of different call: fromuser instead of fromchannel
    //  That lets us propagate a flag "dm":true in all those nodes
    /////////////////////////////////////////////////
    // NO WAIT: 
    //  A user node is something for the future, user preferences, etc.
    //  What's needed now is just DM nodes.
    /////////////////////////////////////////////////
    /**
     * This is a fetch of a DM, a private Channel-like object.
     * It may be for an individual user, or a conversation between two users.
     * The DM for userId is fetched.
     * @param {*} userId 
     * @param {*} id 
     * @param {*} callback 
     */
    self.fetchDM = function(userId, id, callback) {
        console.log("UserModel.fetchDM",id);
        Database.fetchDM(id, function(err, data) {
            console.log("UserModel.fetchDM-1",id,data,err)
            if (err) {
                return callback(err, null);
            }
            else if (data) {
                var kids = data.journals;
                if (kids) {
                    CommonModel.grabChildStructs(userId, kids, function(list) {
                        data.theJournals = list;
                        return callback(err, data);
                    });
                } else {
                    return callback(err, data);
                }
            } else {
                return callback(null, null);
            }
        });
    };

    /**
     * A User is a kind of Channel, but saved in the /data/users directory
     * The Directory and the node are, by default, Public, but what it allows
     * to be shown is not.
     * The idea is that, if you click on a user, we throw up a form which offers you 
     * the opportunity to DM this user. If you accept, then a new User node for you and that user
     * is created and the router vectors to that node and treates it like a private channel
     * Make both a shell user, and a userDM
     * @param creatorId
     * @param creatorHandle
     * @param userId -- the channel name
     * @callback err
     */
    self.newUser = function(creatorId, creatorHandle, userId, handle, callback) {
        CommonModel.newNode(userId, creatorId, creatorHandle, constants.USER_NODE_TYPE, handle, "", false, function(node) {
            Database.saveUserData(node.id, node, function(err) {
                node.isPrivate = true;
                node.type = constants.DM_NODE_TYPE;
                Database.saveDMData(node.id, node, function(err) {
                    return callback(err);
                });
            });
        });
    };

    /**
     * This creates a private channel. This node is never painted in an index:
     * It is called internally when a user clicks on another user's channel
     * @param creatorId -- user starting DM
     * @param creatorHandle
     * @param targetUserId
     * @callback err
     */
    self.newDM = function(creatorId, creatorHandle, targetUserId, callback) {
        var name = targetUserId+"_"+creatorId;
        CommonModel.newNode(name, creatorId, creatorHandle, constants.DM_NODE_TYPE, name, "", true, function(node) {
            var acls = [];
            acls.push(creatorId);
            acls.push(targetUserId);
            node.acls = acls;
            console.log("UserModel.newDM".node);
            Database.saveDMData(node.id, node, function(err) {
                return callback(err, node);
                
            });
        });
    };

    /**
     * Returns a Channel-like view
     * @param {*} creatorId
     * @param creatorHandle
     * @param {*} targetUserId 
     * @param {*} callback err, node
     */
    self.fetchOrCreateDM = function(creatorId, creatorHandle, targetUserId, callback) {
        //////////////////////
        //TWO ways these can happen: target_creator AND creator+target
        // IF either exists, use that one.
        var name = targetUserId+"_"+creatorId;
        var name2 = creatorId+"_"+targetUserId;
        self.fetchDM(creatorId, name, function(err, node) {
            console.log("UserModel.fetchOrCreateDM",name,node);
            if (!node) {
                self.fetchDM(creatorId, name2, function(err1, node1) {
                    console.log("UserModel.fetchOrCreateDM-1",name2,node1);
                    if (!node1) {

                        self.newDM(creatorId, creatorHandle, targetUserId, function(err2, user) {
                            return callback(err2, user);
                        });
                    } else {
                        return callback(err1, node1)
                    }
                });
            } else {

                return callback(err, node);
            }
        });
    };

    self.processUserGet = function(creatorId, creatorHandle, targetUserId, callback) {
        if (creatorId === targetUserId) {
            self.fetchDM(creatorId, targetUserId, function(err, node) {
                return callback(err, node);
            });
        } else {
            self.fetchOrCreateDM(creatorId, creatorHandle, targetUserId, function(err1, user) {
                return callback(err1, user);
            });
       }
    };

    /**
     * All user channels are public
     * @param userId
     */
    self.listUsers = function(userId) {
        var files = Database.listUsers();
        var result = [];
        files.forEach(function(fx) {
            if ((fx !== ".DS_Store") && (fx  !== "dm")) { // mac file system and dm subdirectory
                console.log("UserModel.listUsers",fx);
                self.fetchUser(userId, fx, function(err, thecon) {
                    con = {};
                    con.id = thecon.id;
                    con.img = thecon.imgsm;
                    con.statement = thecon.statement;
                    result.push(con);
                });
            }
        });
        console.log("UserModel.listUsers++",result);
        return result;
    };
};
if (!instance) {
    instance = new User();
}
module.exports = instance;