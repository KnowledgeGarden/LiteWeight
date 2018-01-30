/* @author park */
var Database = require('../drivers/file_database_driver');
var CommonModel;
var EventModel;
var InboxModel;
var uuid = require('uuid');
var constants = require('../constants');
var Conversation,
    instance;

Conversation = function() {
    var self = this;

    self.inject = function(commModel, eventModel, ibModel) {
        CommonModel = commModel;
        EventModel = eventModel;
        InboxModel = ibModel;
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
     * Delete a node by removing it reference from its parent
     * TODO: not sure we can actually remove the file
     * fs.unlinkSync(filePath); will remove a file, but we need to create a set of methods
     * in Database for each nodetype TODO
     * Removing a node means removing it from all of its *snappers*
     * And that depends on the node's type
     * @param {*} userId 
     * @param {*} nodeId 
     * @param {*} callback 
     */             //TODO CHECK FOR CONNECTIONS
    self.deleteNode = function(userId, nodeId, callback) {
        CommonModel.fetchNode(userId, nodeId, function(err, node) {
            var snappers = node.snappers,
                type = node.type,
                error = err;
            snappers.forEach(function(parent) {
                //here, we get the node whether we are allowed to see it or not
                Database.fetchData(parent, function(err, pnt) {
                    error += err;
                    var kids = CommonModel.getChildList(type, pnt),
                        where = kids.indexOf(nodeId);
                        console.log("ConversationModel.deleteNode",nodeId,where,kids,pnt);
                        if (where > -1) {
                            kids.splice(where,1);
                            console.log("ConversationModel.deleteNode-1",kids);
                            CommonModel.setChildList(type, kids, pnt);
                            clearPopulation(pnt);
                            Database.saveData(parent, pnt, function(err) {
                                error += err;
                            });
                        }
                });
            });
            return callback(error);
        });
    };

    /**
     * Completely depopulate this node and remove it from the cache
     * @param {*} node 
     */
    function clearPopulation(node) {
        console.log("ConversationModel.clearPopulation",node);
        if (node.type === constants.TAG_NODE_TYPE) {
            node.theTags = null;
        } else if (node.type === constants.CHANNEL_NODE_TYPE ||
                    node.type === constants.DM_NODE_TYPE) {

            node.theJournals = null;
        } else {
            node.theAnswers = null;
            node.theDecisions = null;
            node.theQuestions = null;
            node.theCons = null;
            node.theNotes = null;
            node.thePros = null;
            node.theReferences = null;
            node.theRelations = null;
        }
        Database.removeFromCache(node.id);
    };

    /**
     * We have to "depopulate" this node because it will be persisted,
     * which means the present population is frozen. That's because
     * CommonModel.populateNode checks to see if a childType is already
     * populated to save fetch cycles
     * //TODO just depopulate entirely?
     * @param {*} nodeType 
     * @param {*} node 
     * /
    function removePopulation(nodeType, node) {
        if (node.type === constants.TAG_NODE_TYPE) {
            node.theTags = null;
        } else if (nodeType === constants.ANSWER_NODE_TYPE) {
            node.theAnswers = null;
        } else if (nodeType === constants.DECISION_NODE_TYPE) {
            node.theDecisions = null;
        } else if (nodeType === constants.QUESTION_NODE_TYPE) {
            node.theQuestions = null;
        } else if (nodeType === constants.CON_NODE_TYPE) {
            node.theCons = null;
        } else if (nodeType === constants.NOTE_NODE_TYPE) {
            node.theNotes = null;
        } else if (nodeType === constants.PRO_NODE_TYPE) {
            node.thePros = null;
        } else if (nodeType === constants.REFERENCE_NODE_TYPE) {
            node.theReferences = null;
        }
    }; */

    /**
     * Return a possibly empty list of handles
     * A nasty example:
     * <p>This one&#39;s for @joe</p>
     * @param contents
     * @returns 
     */
    function scanForMentions(contents) {
        var result = [];
        var where,
            start = 0,
            len = contents.length,
            temp;
        while (((where = contents.indexOf('@', start)) > -1) && where < len) {
            console.log("ConversationModel.scanForMentions",where, start, temp, result, contents);
            var where2 = contents.indexOf(' ', where);
            
            //heuristic -- prove its not just an @ symbol
            if (where2 === -1) {
                where = len;
                start = len;
                //no space found
                if ((len - where) > 2) {
                    temp = contents.substring((where+1), where2).trim();
                }
            } else if ((where2 - where) > 2) {
                start = where2;
                where = where2;
                temp = contents.substring((where+1), where2).trim();
                result.push(temp);
            } 
        }
        return result;
    };

    function processMentions(mentionlist, nodeId) {
        var len = mentionlist.length;
        if (len > 0) {
            metionlist.forEach(function(handle) {
                InboxModel.acceptHandleLink(handle, nodeId, function(err) {
                    console.log("ConversationModel.processMentions",handle, nodeId, err);
                })
            });
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
     * @param url
     * @param isPrivate
     * @param {*} callback err node
     */
    self.newResponseNode = function(creatorId, creatorHandle, parentId, type, statement, details, url, isPrivate, callback) {
        var pv = isPrivate;
        //fetch the parent
        Database.fetchData(parentId, function(err, parent) {
            console.log("ConversationModel.newResponseNode",type,parentId,parent);
            clearPopulation(parent);
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
                if (url) {
                    var urx = url.trim();
                    if (urx !== "") {
                        node.url = urx;
                    }
                }
                if (parent.isProCon) {
                    node.isProCon = true;
                }
                //Deal with @mentions
                var mentions = scanForMentions(details);
                processMentions(mentions, node.id);

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
     * @param {string} parentNode can be null or undefined at first
     * @param {string} currentSelection
     * @callback err JSON
     * https://www.jstree.com/docs/json/
     */
    self.toJsTree = function(userId, rootNodeId, parentNode, currentSelection, callback) {
        console.log("ConversationModel.toJsTree",rootNodeId,parentNode);
        
        var thisNode,
            childArray,
            childNode,
            childStruct,
            curSel = currentSelection,
            shouldOpen = true;
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
                    ///////////////////////////
                    // This is a toggle feature.
                    //  If there is a currentSelection -- the user is viewing a node other than root
                    //  Then opoen all the nodes above it until you get to that node, then stop opening
                    //  The issue is that you don't know where where the damned kid is: which branch?
                    //  The conundrum is that even if you find the kid in the first branch, the second branch
                    //  is iable to open anyway.
                    ////////////////////////////
                    if (shouldOpen && 
                        (!parentNode || curSel)) {
                        //make this node opened
                        var state = {};
                        state.opened = true;
                        thisNode.state = state;
                    }
                    if (curSel  && 
                        ((curSel === rootNodeId) ||
                        (curSel === thisNode.id))) {
                            //turn opening off
                            curSel = null;
                            shouldOpen = false;
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
                                    self.toJsTree(userId, childStruct.id, thisNode, curSel, function(err, tree, canOpen) {
                                        console.log("ConversationModel.toJsTree-3",rootNodeId,tree);            
                                        parentKids.push(tree);
                                        shouldOpen = canOpen;
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
                return callback(null, thisNode, shouldOpen); 
            }
           
        });
    };

};
if (!instance) {
    instance = new Conversation();
}
module.exports = instance;