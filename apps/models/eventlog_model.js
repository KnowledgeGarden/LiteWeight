/**
 * @author park
 * Two kinds of event logs:
 *  A raw event log -- timeline history-- which includes event type,
 *   the node, who did it
 *  A recent log which is restricted only to events of type NewNode
 */
var constants = require('../constants');
var Database = require('../drivers/file_database_driver');

var CommonModel;
var EventLog,
    instance;

EventLog = function() {
    var self = this;

    self.inject = function(commModel) {
        CommonModel = commModel;
    //    console.log("EventLogModel",environment,CommonModel);
    };
    
    function registerRecent(struct, callback) {
        console.log("EventModel.registerRecent",struct);
        Database.saveRecent(struct, function(err) {
            return callback(err);
        });
    };

    /**
     * 
     * @param {*} creatorId 
     * @param handle
     * @param {*} eventType 
     * @param {*} node 
     * @param {*} callback err
     */
    self.registerEvent = function(creatorId, handle, eventType, node, callback) {
        console.log("EventModel.registerEvent",eventType,node);
        var struct = {},
            type = node.type;
        struct.id = node.id;
        struct.img = CommonModel.nodeToSmallIcon(type);
        struct.statement = node.statement;
        struct.creatorId = creatorId;
        struct.handle = handle;
        struct.createdDate = node.createdDate;
        struct.isPrivate = node.isPrivate;
        struct.type = type; // used for a common fetch mechanism
        struct.eventType = eventType;
        Database.saveHistory(struct, function(err) {
            if (eventType === constants.NEW_NODE_EVENT) {
                registerRecent(struct, function(err) {
                    return callback(err);
                });
            } else {
                return callback(err);
            }
        });
    };

    /**
     * struct must include event type, e.g. { type:"LoginEvent", content:"joe"}
     * @param {*} struct 
     * @param {*} callback 
     */
    self.registerSimpleEvent = function(struct, callback) {
        Database.saveHistory(struct, function(err) {
            return callback(err);
        });
    };

    /**
     * We must filter on private nodes
     * @param userId
     * @param {*} count 
     * @param {*} callback 
     */
    self.listRecentEvents = function(userId, count, callback) {
        Database.listRecents(count, function(json) {
            var result = [];
            console.log("EventModel.listRecentEvents",json);
            if (json) {
                json.forEach(function(fx) {
                    console.log("EventModel.listRecentEvents-1",fx);
                    CommonModel.fetchNode(userId, fx.id, function(err, node) {
                        //returns node = null if can't show
                        console.log("EventModel.listRecentEvents-2",userId,err,node);

                        if (node) {
                            result.push(fx);
                        }       
                    });
                });
                return callback(result);
            } else {
                return callback(result)
            }
        });
    };

    self.listHistory = function(start, count, callback) {
        Database.listHistory(start, count, function(json) {
            return callback(json);
        });
    };


};
if (!instance) {
    instance = new EventLog();
}
module.exports = instance;