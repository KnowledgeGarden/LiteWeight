/* @author park */
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
                CommonModel.newNode(constants.BOOKMARK_CHANNEL, constants.SYSTEM_USER, constants.SYSTEM_USER,
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
                CommonModel.newNode(constants.GENERAL_CHANNEL, constants.SYSTEM_USER, constants.SYSTEM_USER,
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
    self.bootstrapHelp = function(callback) {
        Database.fetchChannel(constants.GENERAL_HELP, function(err, data) {
            if (!data) {
                CommonModel.newNode(constants.GENERAL_HELP, constants.SYSTEM_USER, constants.SYSTEM_USER,
                    constants.CHANNEL_NODE_TYPE, "Help", "", false, function(json) {
                        Database.saveChannelData(json.id, json, function(err) {
                            return callback(err);
                        });
                    });
            } else {
                return callback(null);
            }
        });
    };
    self.bootstrapProCon = function(callback) {
        Database.fetchChannel(constants.PROCON_CHANNEL, function(err, data) {
            if (!data) {
                CommonModel.newNode(constants.PROCON_CHANNEL, constants.SYSTEM_USER, constants.SYSTEM_USER,
                    constants.CHANNEL_NODE_TYPE, "ProCon Debate", "", false, function(json) {
                        Database.saveChannelData(json.id, json, function(err) {
                            return callback(err);
                        });
                    });
            } else {
                return callback(null);
            }
        });
    };


    /**
     * Theoretically speaking, this channel would not be visible unless user has credentials
     * to see it. In theory, every node in a channel follows the channels privacy policy, 
     * but still we pass nodes through the CommonModel.fetchNode gauntlet
     * Big issue: this is shared due to UserModel making journals 
     * @param {*} userId 
     * @param {*} id 
     * @param {*} callback 
     */
    self.fetchChannel = function(userId, id, callback) {
        console.log("ChannelModel.fetchChannel",id);
        Database.fetchChannel(id, function(err, data) {
            if (data) {
                var kids = data.journals;
                if (kids) {
                    CommonModel.grabChildStructs(userId, kids, function(list) {
                        data.theJournals = list;
                        return callback(err, data);
                    });
                } else {
                    kids = data.bookmarks;
                    if (kids) {
                        CommonModel.grabChildStructs(userId, kids, function(list) {
                            data.theBookmarks = list;
                            return callback(err, data);
                        });
                    } else {
                        return callback(err, data);
                    }
                }
            } else {
                Database.fetchDM(id, function(err1, data1) {
                    if (data1) {
                        var kids = data1.journals;
                        if (kids) {
                            CommonModel.grabChildStructs(userId, kids, function(list) {
                                data.theJournals = list;
                                return callback(err, data1);
                            });
                        } else {
                            return callback(err1, data1);
                        }
                    } else {
                        return callback(err1, data1);
                    }
                });
            }           
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
     * @param creatorHandle
     * @param statement
     * @param members if is private
     * @param isPrivate
     * @param callback  err node
     */
    self.createChannel = function(creatorId, creatorHandle, statement, members, isPrivate, callback) {
        var id = CommonModel.replaceAll(statement, ' ', '_');
        id = id.toLowerCase();
        CommonModel.newNode(id, creatorId, creatorHandle, constants.CHANNEL_NODE_TYPE, statement, "", isPrivate, function(node) {
            console.log("ChannelModel.createChannel",id,isPrivate,members,node);

            if (isPrivate) {
                var mlist = [];
                mlist.push(creatorId);
                if (members !== '') {
                    var ta = members.split(',');
                    var len = ta.length;
                    if (len > 0) {
                        for (var i=0;i<len;i++) {
                            mlist.push(ta[i].trim());
                        }
                    } else {
                        mlist.push(members);   // just one added member
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
        } else {
            console.log("ChannelModel.listChannels-1",fileNames);
            fileNames.forEach(function(fx) {
                if (fx) {
                    if (!fx.includes(".DS_Store")) { // mac file system
                        self.fetchChannel(userId, fx, function(err, thecon) {
                            var canSee = CommonModel.canShow(userId,thecon);
                            console.log("ChannelModel.listChannels-2",canSee, thecon, userId);
                            if (canSee) {
                                console.log("FCH", fx, thecon);
                                con = {};
                                con.id = thecon.id;
                                con.img = thecon.imgsm;
                                con.statement = thecon.statement;
                                result.push(con);
                            }
                        });
                    }
                }
            });
            return result;
        };
    }

};
if (!instance) {
    instance = new Channel();
}
module.exports = instance;