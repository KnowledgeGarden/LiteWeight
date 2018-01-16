/* @author park */
var Database = require('../drivers/file_database_driver');
var CommonModel;
var EventModel;
var uuid = require('uuid');
var constants = require('../constants');
var Conversation,
    instance;

Conversation = function() {
    var self = this;

    self.inject = function(commModel, eventModel) {
        CommonModel = commModel;
        EventModel = eventModel;
    };

    /**
     * Fetch a node
     * @param userId
     * @param {*} viewId 
     * @param {*} callback err json
     */
    self.fetchView = function(userId, viewId, callback) {
        console.log("ConversationModel.fetchView",viewId);
        CommonModel.fetchNode(userId, viewId, function(err, data) {
            console.log("ConversationModel.fetchView-1",err,data);
            if (err) {
                return callback(err, null);
            } else {
                CommonModel.populateNode(userId, data, function(node) {
                    console.log("ConversationModel.fetchView++",err,node);
                    return callback(err, node);
                });
            }
        });
    };


    //////////////////////////////
    // TODO
    //  Making conversations about heterogeneous node types is complicated.
    //      In the file-based system:
    //          All conversation nodes go in /data
    //          All bookmark nodes go in /data/bookmarks
    //      To make matters worse:
    //          If someone plugs in a new app, e.g. blog,
    //          Then we need to deal with that as well.
    //  BEST to let the interpretation of where to save a node be handled
    //      in the database_driver.
    //  Same thing goes for fetching
    //      fetchView ASSUMES it is a conversation node.
    //          IN FACT, it might be a bookmark,blog, etc.
    //////////////////////////////

    /**
     * We have to "depopulate" this node because it will be persisted,
     * which means the present population is frozen. That's because
     * CommonModel.populateNode checks to see if a childType is already
     * populated to save fetch cycles
     * @param {*} nodeType 
     * @param {*} node 
     */
    function removePopulation(nodeType, node) {
        if (nodeType === constants.ANSWER_NODE_TYPE) {
            node.theAnswers = null;
        } else if (nodeType === constants.DECISION_NODE_TYPE) {
            node.theDecisions = null;
        } else if (nodeType === constants.CON_NODE_TYPE) {
            node.theCons = null;
        } else if (nodeType === constants.NOTE_NODE_TYPE) {
            node.theNotes = null;
        } else if (nodeType === constants.PRO_NODE_TYPE) {
            node.thePros = null;
        } else if (nodeType === constants.REFERENCE_NODE_TYPE) {
            node.theReferences = null;
        }
    };
    /**
     * Create a response node and add its reference to the parent
     * @param {*} creatorId
     * @param creatorHandle
     * @param {*} parentId 
     * @param {*} type 
     * @param {*} statement 
     * @param {*} details 
     * @param isPrivate
     * @param {*} callback err node
     */
    self.newResponseNode = function(creatorId, creatorHandle, parentId, type, statement, details, isPrivate, callback) {
        var pv = isPrivate;
        //fetch the parent
        Database.fetchData(parentId, function(err, parent) {
            console.log("ConversationModel.newResponseNode",type,parentId,parent);
            removePopulation(type, parent);
            var acls = parent.acls;
            var context;
            if (parent.type === constants.BLOG_NODE_TYPE ||
                parent.type === constants.BOOKMARK_NODE_TYPE) {
                    context = parent.id
            } else {
                context = parent.context;
            }
            //create the response node
            // if parent has acls, then child follows parent's privacy
            if (acls) {
                pv = parent.isPrivate;
            }
            CommonModel.newNode(null, creatorId, creatorHandle, type, statement, details, pv, function(node) {
                console.log("ConversationModel.newResponseNode-1",type,node);
                node.context = context;
                //wire them together
                CommonModel.addChildToNode(type, creatorId, node, parent);
                //update parent's version
                if (acls) {
                    node.acls = acls;
                }
                parent.version = CommonModel.newId();
                //save the parent
                console.log("ConversationModel.newResponseNode-2",parent,node);
                Database.saveData(parentId, parent, function(err) {
                    //save the response node
                    Database.saveNodeData(node.id, node, function(ex) {
                        return callback(ex, node);
                    });
                });
            });
        });
    };


    function fetchAllkidStructs(node) {
        //There really is a better way to do this
        var result = [];
        var snappers = node.theAnswers;
        if (snappers) {
            result = snappers;
        }
        snappers = node.theQuestions;
        if (snappers) {
            result = result.concat(snappers);
        }
        snappers = node.thePros;
        if (snappers) {
            result = result.concat(snappers);
        }
        snappers = node.theCons;
        if (snappers) {
            result = result.concat(snappers);
        }
        snappers = node.theNotes;
        if (snappers) {
            result = result.concat(snappers);
        }
        snappers = node.theReferences;
        if (snappers) {
            result = result.concat(snappers);
        }
        snappers = node.theDecisions;
        if (snappers) {
            result = result.concat(snappers);
        }
        snappers = node.theRelations;
        if (snappers) {
            result = result.concat(snappers);
        }
        snappers = node.theTags;
        if (snappers) {
            result = result.concat(snappers);
        }

        return result;
    };

    /**
     * A recursive tree builder which returns a JSON tree
     * @param userId
     * @param {string} rootNodeId
     * @param {string} parentNodeId can be null or undefined at first
     * @callback err JSON
     * https://www.jstree.com/docs/json/
     */
    self.toJsTree = function(userId, rootNodeId, parentNode, callback) {
        console.log("ConversationModel.toJsTree",rootNodeId,parentNode);
        var parentStack = [];
        parentStack.push(rootNodeId)
        var thisNode,
            childArray,
            childNode,
            childStruct;
        //fetch this parent
        //NOTE: userId might not be able to see this node
        CommonModel.fetchNode(userId, rootNodeId, function(err, data) {
            console.log("ConversationModel.toJsTree-1",rootNodeId,data);
            if (err)  { // unlikely private node in tree this user cannot see
                return callback(err, null);
            } else {
                CommonModel._populateNode(userId, data, function(node) {
                    console.log("ConversationModel.toJsTree-1A",node);
                    //craft thisNode
                    thisNode = {};
                    thisNode.id = node.id;
                    thisNode.type = node.type;
                    if (!parentNode) {
                        var state = {};
                        state.opened = true;
                        thisNode.state = state;
                    }
                    thisNode.text = node.statement;
                    thisNode.icon = CommonModel.nodeToSmallIcon(node.type);
                    //We are now crafting the children of thisNode
                    var parentKids = thisNode.children;
                    if (!parentKids) {
                        parentKids = [];
                    }
                    if (node.type !== constants.TAG_NODE_TYPE) {
                        var snappers = fetchAllkidStructs(node);
                        console.log("ConversationModel.toJsTree-2",snappers);
                        if (snappers) {
                            var len = snappers.length;
                            snappers.forEach(function(childStruct) {      
                                if (childStruct) {
                                    //recurse
                                    self.toJsTree(userId, childStruct.id, thisNode, function(err, tree) {
                                        console.log("ConversationModel.toJsTree-3",rootNodeId,tree);            
                                        parentKids.push(tree);
                                    });
                                }
                                console.log("ConversationModel.toJsTree-4",len,parentKids);
                            });
                            if (parentKids.length > 0) {
                                thisNode.children = parentKids;                    
                            }
                        }
                    }
                });
                console.log("ConversationModel.toJsTree++",thisNode);
                return callback(null, thisNode); 
            }
           
        });
    };

};
if (!instance) {
    instance = new Conversation();
}
module.exports = instance;