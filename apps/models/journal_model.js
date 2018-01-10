/* @author park */
var constants = require('../constants');
var Database = require('../drivers/file_database_driver');
var CommonModel;
var Journal,
    instance;

Journal = function() {
    var self = this;

    self.inject = function(commModel) {
        CommonModel = commModel;
        //console.log("JournalModel",this);        
    };

    self.fetchJournal = function(userId, id, callback) {
        console.log("JournalModel.fetchJournal",id);
        //generalize: the bookmark channel can send in bookmarks
        CommonModel.fetchNode(userId, id, function(err, data) {
            if (err) {
                return callback(err, null);
            }
            CommonModel.populateNode(userId, data, function(node) {
                console.log("JournalModel.fetchJournal++",err,node);
                return callback(err, node);
            });
        });
    };

    /**
     * IF creatorId !== channelId, must fetch creatorId as well to make a composite
     * for that user
     * @param {*} creatorId 
     * @param {*} channelId 
     * @param {*} statement 
     * @param {*} details 
     * @param {*} isPrivate 
     * @param {*} callback 
     */
    self.createJournalFromDM = function(creatorId, channelId, statement, details, isPrivate, callback) {
        Database.fetchDM(channelId, function(err, channel) {
            var acls = channel.acls;
            console.log("JournalModel.createFromChannel",isPrivate,channel,statement);
            CommonModel.newNode(null, creatorId, constants.BLOG_NODE_TYPE, statement, details, isPrivate, function(node) {
                node.dm = true; // tell it that it is a DM node
                CommonModel.addChildToNode(constants.BLOG_NODE_TYPE, creatorId, node, channel);
                console.log("JournalModel.createFromChannel-1",node,channel);
                node.acls = acls;
                channel.version = CommonModel.newId();
                Database.saveDMData(channel.id, channel, function(err2) {
                    //if (creatorId === channelId) {
                        // we're done
                        Database.saveNodeData(node.id, node, function(err) {
                    
                            console.log("JournalModel.createFromChannel-2",node);
                            return callback(err2, node);
                        });
                   /* } else {
                        //have to put this stuff in the user's own DM
                        Database.fetchDM(creatorId, function(err, userdm) {
                            CommonModel.addChildToNode(constants.BLOG_NODE_TYPE, creatorId, node, userdm);
                            userdm.version = CommonModel.newId();
                            Database.saveDMData(userdm.id, userdm, function(err2) {
                                Database.saveNodeData(node.id, node, function(err) {
                    
                                    console.log("JournalModel.createFromChannel-3",node);
                                    return callback(err, node);
                                });
                            });
                        });
                    }*/
                    
                });
            });
        });
    };

    /**
     * 
     * @param {*} creatorId 
     * @param {*} channelId 
     * @param {*} statement 
     * @param {*} details
     * @param {*} isPrivate 
     * @param {*} callback err node
     */
    self.createJournalFromChannel = function(creatorId, channelId, statement, details, isPrivate, callback) {
        Database.fetchChannel(channelId, function(err, channel) {
            var acls;
           // if (channel) {
                acls = channel.acls;
                console.log("JournalModel.createFromChannel",isPrivate,channel,statement);
                CommonModel.newNode(null, creatorId, constants.BLOG_NODE_TYPE, statement, details, isPrivate, function(node) {
                    CommonModel.addChildToNode(constants.BLOG_NODE_TYPE, creatorId, node, channel);
                    console.log("JournalModel.createFromChannel-1",node,channel);
                    node.acls = acls;
                    channel.version = CommonModel.newId();
                    Database.saveNodeData(node.id, node, function(err) {
                        Database.saveChannelData(channel.id, channel, function(err2) {
                            console.log("JournalModel.createFromChannel-2",node);
                            return callback(err2, node);
                        });
                        
                    });
                });
           /* } else {
                Database.fetchDM(channelId, function(err1, channel1) {
                    if (channel1) {
                        acls = channel1.acls;
                        console.log("JournalModel.createFromChannel-A",isPrivate,channel1,statement);
                        CommonModel.newNode(null, creatorId, constants.BLOG_NODE_TYPE, statement, details, isPrivate, function(node) {
                            CommonModel.addChildToNode(constants.BLOG_NODE_TYPE, creatorId, node, channel1);
                            console.log("JournalModel.createFromChannel-B",node,channel);
                            node.acls = acls;
                            channel1.version = CommonModel.newId();
                            Database.saveNodeData(node.id, node, function(err) {
                                Database.saveDMData(channel1.id, channel1, function(err2) {
                                    console.log("JournalModel.createFromChannel-C",node);
                                    return callback(err2, node);
                                });
                                
                            });
                        });   
                    } else {
                        return callback(err1, channel1);
                    }

                });
            }*/
        });
    };

    /**
     * @param creatorId
     * @param statement
     * @param details
     * @param isPrivate
     * @param callback  err node
     */
    self.createJournalEntry = function(creatorId, statement, details, isPrivate, callback) {
        CommonModel.newNode(null, creatorId, constants.BLOG_NODE_TYPE, statement, details, isPrivate, function(node) {
            Database.saveNodeData(node.id, node, function(err) {
                return callback(err, node);
            });
        });
    };


};
instance = new Journal();
module.exports = instance;