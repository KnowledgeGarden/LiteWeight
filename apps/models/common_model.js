var constants = require('../constants');
var environment = require('../environment');
var Database = require('../drivers/file_database_driver');
var EventLogModel;
var Common,
    instance;

Common = function() {
    var self = this;

    self.inject = function(eventModel) {
        EventLogModel = eventModel;
    //    console.log("CommonModel",environment,EventLogModel);
    }

    // user UUIDs for Node IDs
    // TODO not used
    self.newUUID = function() {
        return uuid.v4();
    };

    //https://stackoverflow.com/questions/23593052/format-javascript-date-to-yyyy-mm-dd
    self.newDate = function() {
        return new Date().toISOString().slice(0,10);
    };

    //https://stackoverflow.com/questions/1137436/what-are-useful-javascript-methods-that-extends-built-in-objects/1137579#1137579
    String.prototype.replaceAll = function(search, replace)
    {
        //if replace is not sent, return original string otherwise it will
        //replace search string with 'undefined'.
        if (replace === undefined) {
            return this.toString();
        }
    
        return this.replace(new RegExp('[' + search + ']', 'g'), replace);
    };
    /**
     * 
     * @param {*} str 
     * @returns
     */
    self.replaceAll = function(str, search, replace) {
        return str.replaceAll(search, replace);
    };

    /**
     * Some potential for collision
     * @return
     */
    self.newId = function() {
        var d = new Date();
        return d.getTime().toString();
    };

    /**
     * Utility to fetch any kind of node
     * @param {*} nodeId 
     * @param {*} callback err data
     */
    self.fetchNode = function(nodeId, callback) {
        Database.fetchData(nodeId, function(err, node) {
            return callback(err, node);
        });
    };

    /**
     * A temporary patch to be removed soon
     * @param node
     * @param callback ()
     */
    self.validateNodeImage = function(node, callback) {
        var smallImage = node.imgsm;
        if (!smallImage) {
            smallImage = self.nodeToSmallIcon(node.type);
            node.imgsm = smallImage;
            node.version = self.newId();
            Database.saveData(node.id, node, function(err) {
                return callback();
            });
        } else {
            return callback();
        }
    }

    self.nodeToSmallIcon = function(type) {
        if (type === constants.ANSWER_NODE_TYPE) {
            return "/images/ibis/position_sm.png";
        } else if (type === constants.CON_NODE_TYPE) {
            return "/images/ibis/minus_sm.png";
        } else if (type === constants.PRO_NODE_TYPE) {
            return "/images/ibis/plus_sm.png";
        } else if (type === constants.QUESTION_NODE_TYPE) {
            return "/images/ibis/issue_sm.png";
        } else if (type === constants.NOTE_NODE_TYPE) {
            return "/images/ibis/note_sm.png";
        } else if (type === constants.REFERENCE_NODE_TYPE) {
            return "/images/ibis/reference_sm.png";
        } else if (type === constants.TAG_NODE_TYPE) {
            return "/images/tag_sm.png";
        } else if (type === constants.DECISION_NODE_TYPE) {
            return "/images/ibis/decision_sm.png";
        } else if (type === constants.RELATION_NODE_TYPE) {
            return "/images/cogwheel_sm.png";
        } else if (type === constants.BOOKMARK_NODE_TYPE) {
            return "/images/bookmark_sm.png";
        } else if (type === constants.CONVERSATION_NODE_TYPE) {
            return "/images/ibis/map_sm.png";
        } else if (type === constants.MAP_NODE_TYPE) {
            return "/images/ibis/map_sm.png";
        } else if (type === constants.BLOG_NODE_TYPE) {
            return "/images/publication_sm.png";
        } else if (type === constants.CHANNEL_NODE_TYPE) {
            return ""; // NO ICOON YET
        } else {
            console.log("CommonModel.nodeToSmallIcon ERROR",type);
            throw "Bad Type 1: "+type;
        }
    };

    self.nodeTolargeIcon = function(type) {
        if (type === constants.ANSWER_NODE_TYPE) {
            return "/images/ibis/position.png";
        } else if (type === constants.CON_NODE_TYPE) {
            return "/images/ibis/minus.png";
        } else if (type === constants.PRO_NODE_TYPE) {
            return "/images/ibis/plus.png";
        } else if (type === constants.QUESTION_NODE_TYPE) {
            return "/images/ibis/issue.png";
        } else if (type === constants.NOTE_NODE_TYPE) {
            return "/images/ibis/note.png";
        } else if (type === constants.REFERENCE_NODE_TYPE) {
            return "/images/ibis/reference.png";
        } else if (type === constants.TAG_NODE_TYPE) {
            return "/images/tag.png";
        } else if (type === constants.DECISION_NODE_TYPE) {
            return "/images/ibis/decision.png";
        } else if (type === constants.RELATION_NODE_TYPE) {
            return "/images/cogwheel.png";
        } else if (type === constants.BOOKMARK_NODE_TYPE) {
            return "/images/bookmark.png";
        } else if (type === constants.CONVERSATION_NODE_TYPE) {
            return "/images/ibis/map.png";
        } else if (type === constants.MAP_NODE_TYPE) {
            return "/images/ibis/map.png";
        } else if (type === constants.BLOG_NODE_TYPE) {
            return "/images/publication.png";
        } else if (type === constants.CHANNEL_NODE_TYPE) {
            return ""; // NO ICON YET
        } else {
            console.log("CommonModel.nodeTolargeIcon ERROR",type);
            throw "Bad Type 2: "+type;
        }
    };

    /**
     * Core node creation function
     * @param nodeId  can be null
     * @param {*} creatorId 
     * @param {*} type 
     * @param {*} statement 
     * @param {*} details 
     * @param isPrivate
     * @param callback json
     */
    self.newNode = function(nodeId, creatorId, type, statement,
                details, isPrivate, callback) {
        console.log("CommonModel.newNode"+creatorId,type);
        var result = {},
            ix = nodeId;
        if (!ix) {
            ix = self.newId();
        }
        result.id = ix;
        result.creatorId = creatorId;
        result.createdDate = self.newDate(); //new Date();
        result.version = self.newId();
        result.type = type;
        result.img = self.nodeTolargeIcon(type);
        result.imgsm = self.nodeToSmallIcon(type);
        result.statement = statement;
        result.details = details;
        EventLogModel.registerEvent(creatorId, constants.NEW_NODE_EVENT, result, function(err) {
            console.log("CommonModel.newNode",creatorId,type,result);
            return callback(result);
        });
    };

    //////////////////////////////////
    // IF a Statement (label) is changed, then
    // we have to find all the structs which use that
    // statement and change them to the new version
    // constants.EDIT_NODE_EVENT
    /////////////////////////////////
    /**
     * Test for conversational children
     * @param {*} node 
     */
    self.hasIBISChildren = function (node) {
        var x = node.questions;
        if (x) {
            return true;
        }
        x = node.answers;
        if (x) {
            return true;
        }
        x = node.pros;
        if (x) {
            return true;
        }
        x = node.cons;
        if (x) {
            return true;
        }
        return false; // default
    };

    function sameStatements(json, node) {
        return (json.statement === node.statement);
    };

    /**
     * Ripple through the entire database
     * looking for nodes with children that hold this node
     * as a child
     * @param {*} oldStatement 
     * @param {*} node 
     * @param {*} callback 
     */
    function propagateStatementChange(oldStatement, node, callback) {
        //TODO
        return callback(null);
    };

    /**
     * json could include statement, details, url, ...
     * @param {*} json 
     * @param {*} callback err
     */
    self.updateNode = function(json, callback) {
        var nodeId = json.hidden_1,
            version = json.hidden_2;
        //fetch the node being edited
        self.fetchNode(nodeId, function(err, oldNode) {
            //deal with statement
            var labelChanged = false;
            var oldStatement = oldNode.statement;
            if (!self.hasIBISChildren(oldNode)) {
                labelChanged = sameStatements(json, oldNode);
            }
            //deal with URL if any
            if (json.url) {
                oldNode.url = json.url;
            }
            //deal with details
            if (json.details) {
                oldNode.details = json.details;
            }
            oldNode.version = self.newId();
            // save it
            Database.saveData(oldNode.id, oldNode, function(err) {
                if (labelChanged) {
                    propagateStatementChange(oldStatement, node, function(err) {
                        return callback(err);
                    });
                } else {
                    return callback(err);
                }
            });
        });
    };

    /**
     * Refer to constants.js for fields
     * @param {*} type 
     * @param {*} node
     * @return possibly empty array
     */
    self.getChildList = function (type, node) {
        var result;
        try {
            if (type === constants.ANSWER_NODE_TYPE) {
                result = node.answers;
            } else if (type === constants.CON_NODE_TYPE) {
                result = node.conargs;
            } else if (type === constants.PRO_NODE_TYPE) {
                result = node.proargs;
            } else if (type === constants.QUESTION_NODE_TYPE) {
                result = node.questions;
            } else if (type === constants.NOTE_NODE_TYPE) {
                result = node.notes;
            } else if (type === constants.REFERENCE_NODE_TYPE) {
                result = node.references;
            } else if (type === constants.TAG_NODE_TYPE) {
                result = node.tags;
            } else if (type === constants.DECISION_NODE_TYPE) {
                result = node.decisions;
            } else if (type === constants.RELATION_NODE_TYPE) {
                result = node.relations;
            } else if (type === constants.BOOKMARK_NODE_TYPE) {
                result = node.bookmarks;
            } else if (type === constants.BLOG_NODE_TYPE) {
                result = node.journals;
            } else if (type === constants.CHANNEL_NODE_TYPE) {
                result = node.journals;
            } else {
                    throw "Bad Type 3 "+type;
            } 
        } catch (e) {}
        if (!result) {
            result = [];
        }
        console.log("ConModel.getChildList",type,result,node);     
        return result;
    };

    self.setChildList = function (type, list, node) {
        console.log("ConModel.setChildList",type,list,node);
        if (type === constants.ANSWER_NODE_TYPE) {
            node.answers = list;
        } else if (type === constants.CON_NODE_TYPE) {
            node.conargs = list;
        } else if (type === constants.PRO_NODE_TYPE) {
            node.proargs = list;
        } else if (type === constants.QUESTION_NODE_TYPE) {
            node.questions = list;
        } else if (type === constants.NOTE_NODE_TYPE) {
            node.notes = list;
        } else if (type === constants.REFERENCE_NODE_TYPE) {
            node.references = list;
        } else if (type === constants.TAG_NODE_TYPE) {
            node.tags = list;
        } else if (type === constants.DECISIONS_NODE_TYPE) {
            node.decisions = list;
        } else if (type === constants.RELATION_NODE_TYPE) {
            node.relations = list;
        } else if (type === constants.BOOKMARK_NODE_TYPE) {
            node.bookmarks = list;
        } else if (type === constants.BLOG_NODE_TYPE) {
            node.journals = list;
        } else if (type === constants.CHANNEL_NODE_TYPE) {
            node.journals = list;
        } else {
            throw "Bad Type 4 "+type;
        }
    };

    //////////////////////////
    // How many times can a child have a parent?
    //  If it is transcluded, many
    //  If not, just one
    /////////////////////////

    /**
     * Add a child struct to a given node
     * @param {*} childType 
     * @param creatorId
     * @param {*} theChildNode 
     * @param {*} targetNode 
     */
    self.addStructToNode = function(childType, creatorId, theChildNode, targetNode) {
        console.log("CommonModel.addStructToNode",childType,theChildNode,targetNode);
        var struct = {},
            type = theChildNode.type,
            img = theChildNode.imgsm;
        struct.id = theChildNode.id;
        struct.img = img;
        struct.type = type;
        //creatorId is NOT related to the node but to whom credit is given for this struct
        struct.creatorId = creatorId;
        struct.statement = theChildNode.statement;
        var kids = self.getChildList(childType, targetNode);
        if (!kids) {
            kids = [];
        }
        kids.push(struct);
        self.setChildList(childType, kids, targetNode);
        //snappers are an index into every node that carries the child's struct
        var snappers = theChildNode.snappers;
        if (!snappers) {
            snappers = [];
        }
        snappers.push(targetNode.id);
        theChildNode.snappers = snappers;
        if (theChildNode.type !== constants.TAG_NODE_TYPE) {
            //DANGER: assuming one parent
            struct= {};
            struct.id = targetNode.id;
            struct.img = targetNode.imgsm;
            struct.creatorId = targetNode.creatorId;
            struct.statement = targetNode.statement;
            theChildNode.parent = struct;
        }
    };
};
//noticed that if you call a class > 1 times, best to
// just send a singleton
if (!instance) {
    instance = new Common();
}
module.exports = instance;
