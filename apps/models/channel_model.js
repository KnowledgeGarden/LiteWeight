var Database = require('../drivers/file_database_driver');
var CommonModel;
var EventModel;
var uuid = require('uuid');
var constants = require('../constants');
var Channel,
    instance;

Channel = function() {
    var self = this;

    self.inject = function(commModel, eventModel) {
        CommonModel = commModel;
        EventModel = eventModel;
    };

    /**
     * Ensure that there are bookmark and general channels
     * @param {*} callback err
     */
    self.bootstrapBookmarks = function(callback) {
        Database.fetchChannel("bookmarks", function(err, data) {
            if (!data) {
                CommonModel.newNode(constants.BOOKMARK_CHANNEL, "system", 
                    constants.CHANNEL_NODE_TYPE, "Bookmarks", "", false, function(json) {
                        Database.saveChannelData(json.id, json, function(err) {
                            return callback(err);
                        });
                    });
            } else {
                return callback(null);
            }
        });
    };
    self.bootstrapGeneral = function(callback) {
        Database.fetchChannel(constants.GENERAL_CHANNEL, function(err, data) {
            if (!data) {
                CommonModel.newNode(constants.GENERAL_CHANNEL, "system", 
                    constants.CHANNEL_NODE_TYPE, "General", "", false, function(json) {
                        Database.saveChannelData(json.id, json, function(err) {
                            return callback(err);
                        });
                    });
            } else {
                return callback(null);
            }
        });
    };

    self.fetchChannel = function(id, callback) {
        console.log("ChannelModel.fetchChannel",id);
        Database.fetchChannel(id, function(err, data) {
            return callback(err, data);            
        });
    };

    /**
     * @param {*} channelId 
     * @param {*} newMemberId 
     * @param {*} creatorId 
     * @param {*} callback 
     */
    self.addMemberToChannel = function(channelId, newMemberId, creatorId, callback) {
        //TODO
    };

    /**
     * NOTE: this removes from the channel's ACL and must be propagated
     * Along all private channel entries and children
     * @param {*} channelId 
     * @param {*} removeMemberId 
     * @param {*} creatorId 
     * @param {*} callback 
     */
    self.removeMemberFromChannel = function(channelId, removeMemberId, creatorId, callback) {
        //TODO
    };

    /**
     * @param creatorId
     * @param statement
     * @param members if is private
     * @param isPrivate
     * @param callback  err node
     */
    self.createChannel = function(creatorId, statement, members, isPrivate, callback) {
        var id = CommonModel.replaceAll(statement, ' ', '_');
        id = id.toLowerCase();
        CommonModel.newNode(id, creatorId, constants.CHANNEL_NODE_TYPE, statement, "", isPrivate, function(node) {
            console.log("ChannelModel.createChannel",id,isPrivate,members,node);

            if (isPrivate) {
                var mlist = [];
                mlist.push(creatorId);
                var ta = members.split(',');
                if (ta.length > 0) {
                    for (var i=0;i<len;i++) {
                        mlist.push(ta[i].trim());
                    }
                }
                node.acls = mlist;
            }
            console.log("ChannelModel.createChannel-2",node);
            
            Database.saveChannelData(node.id, node, function(err) {
                return callback(err, node);
            });
        });
    };

    /**
     * Reqiore iserId to filter private channels
     * @param {*} userId can be undefined
     */
    self.listChannels = function(userId) {
        var fileNames= Database.listChannels();
        console.log("LISTCH",fileNames);
        var result = [],
            temp,
            con;
        if (fileNames.length === 0) {
            console.log("ChannelModel.listChannels",fileNames);
            return result;
        }
        console.log("ChannelModel.listChannels-1",fileNames);
        fileNames.forEach(function(fx) {
            if (fx) {
                if (!fx.includes(".DS_Store")) { // mac file system
                    self.fetchChannel(fx, function(err, thecon) {
                        var canSee = CommonModel.canShow(userId,thecon);
                        /*
                        if (thecon.isPrivate) {
                            if (!userId) {
                                canSee = false;
                            } else {
                                var acls = thecon.acls;
                                if (acls && acls.indexOf(userId) == -1) {
                                    canSee = false;
                                }
                            }

                        }
                        */
                        console.log("ChannelModel.listChannels-2",canSee, thecon, userId);
                        if (canSee) {
                            CommonModel.validateNodeImage(thecon, function() {
                                console.log("FCH", fx, thecon);
                                con = {};
                                con.id = thecon.id;
                                con.img = thecon.imgsm;
                                con.statement = thecon.statement;
                                result.push(con);
                            });
                        }
                    });
                }
            }
        });
        return result;
    };

};
instance = new Channel();
module.exports = instance;