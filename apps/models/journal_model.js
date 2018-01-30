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
            } else {
                CommonModel.populateNode(userId, data, function(node) {
                    console.log("JournalModel.fetchJournal++",err,node);
                    return callback(err, node);
                });
            }
        });
    };

    /**
     * IF creatorId !== channelId, must fetch creatorId as well to make a composite
     * for that user
     * @param {*} creatorId 
     * @param creatorHandle
     * @param {*} channelId 
     * @param {*} statement 
     * @param {*} details 
     * @param {*} isPrivate 
     * @param {*} callback 
     */
    self.createJournalFromDM = function(creatorId, creatorHandle, channelId, statement, details, isPrivate, callback) {
        Database.fetchDM(channelId, function(err, channel) {
            var acls = channel.acls;
            console.log("JournalModel.createFromChannel",isPrivate,channel,statement);
            CommonModel.newNode(null, creatorId, creatorHandle, constants.BLOG_NODE_TYPE, statement, details, isPrivate, function(node) {
                node.dm = true; // tell it that it is a DM node
                CommonModel.addChildToNode(constants.BLOG_NODE_TYPE, creatorId, node, channel);
                console.log("JournalModel.createFromChannel-1",node,channel);
                node.acls = acls;
                channel.version = CommonModel.newId();
                Database.saveDMData(channel.id, channel, function(err2) {
                    // we're done
                    Database.saveNodeData(node.id, node, function(err) {
                
                        console.log("JournalModel.createFromChannel-2",node);
                        return callback(err2, node);
                    });
                   
                });
            });
        });
    };

    /**
     * 
     * @param {*} creatorId 
     * @param creatorHandle
     * @param {*} channelId 
     * @param {*} statement 
     * @param {*} details
     * @param {*} isPrivate 
     * @param {*} callback err node
     */
    self.createJournalFromChannel = function(creatorId, creatorHandle, channelId, statement, details, isPrivate, callback) {
        Database.fetchChannel(channelId, function(err, channel) {
            var acls = channel.acls;
            console.log("JournalModel.createFromChannel",isPrivate,channel,statement);
            CommonModel.newNode(null, creatorId, creatorHandle, constants.BLOG_NODE_TYPE, statement, details, isPrivate, function(node) {
                CommonModel.addChildToNode(constants.BLOG_NODE_TYPE, creatorId, node, channel);
                console.log("JournalModel.createFromChannel-1",node,channel);
                node.acls = acls;
                channel.version = CommonModel.newId();
                if (channelId === constants.PROCON_CHANNEL) {
                    node.isProCon = true;
                }
                Database.saveNodeData(node.id, node, function(err) {
                    Database.saveChannelData(channel.id, channel, function(err2) {
                        console.log("JournalModel.createFromChannel-2",node);
                        return callback(err2, node);
                    });
                    
                });
            });
 
        });
    };

    /**
     * @param creatorId
     * @param creatorHandle
     * @param statement
     * @param details
     * @param isPrivate
     * @param callback  err node
     */
    self.createJournalEntry = function(creatorId, creatorHandle, statement, details, isPrivate, callback) {
        CommonModel.newNode(null, creatorId, creatorHandle, constants.BLOG_NODE_TYPE, statement, details, isPrivate, function(node) {
            Database.saveNodeData(node.id, node, function(err) {
                return callback(err, node);
            });
        });
    };


};
if (!instance) {
    instance = new Journal();
}
module.exports = instance;