/* @author park */
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
//////////////////////////////////
// Identity
//////////////////////////////////

    // user UUIDs for Node IDs
    // TODO not used
    self.newUUID = function() {
        return uuid.v4();
    };

    /**
     * Some potential for collision
     * @return
     */
    self.newId = function() {
        var d = new Date();
        return d.getTime().toString();
    };


//////////////////////////////////
// Date-Time
//////////////////////////////////


    //https://stackoverflow.com/questions/23593052/format-javascript-date-to-yyyy-mm-dd
    self.newDate = function() {
        return new Date().toLocaleString(); //  1/6/2018, 1:35:11 PM
        //toLocaleDateString(); 1/6/2018
        //toISOString().slice(0,10); 2018-01-06
    };

//////////////////////////////////
// Utility
//////////////////////////////////

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

//////////////////////////////////
// Privacy
//////////////////////////////////

    /**
     * Return <code>true</code> if this user can see the given node
     * @param {*} userId 
     * @param {*} node 
     */
    self.canShow = function(userId, node) {
        console.log("CommonModel.canShow",userId,node);
        var canSee = true;
        if (node.isPrivate) {
            if (!userId) {
                // no userId, no way, jose.
                canSee = false;
                // does this user own this node?
            } else if (userId !== node.creatorId) {
                // look now for ACLs
                var acls = node.acls;
                if (acls) {
                    console.log("CANSEE-2",userId, acls);
                    if (acls && acls.indexOf(userId) == -1) {
                    canSee = false;
                    }
                } else {
                    //poof! It's private. Full stop.
                    canSee = false;
                }
            }
        }
        if (node.type === constants.RELATION_NODE_TYPE) {
            // MUST EXAMINE Source and Target
            var nx = node.sourceNode;
            Database.fetchData(nx, function(err, dx) {
               // console.log("CommonModel.canShow-1",userId,dx);
                canSee = self.canShow(userId, dx);

                if (canSee) {
                    nx = node.targetNode;
                    Database.fetchData(nx, function(err, dy) {
                     //   console.log("CommonModel.canShow-2",userId,dy);
                        canSee = self.canShow(userId, dy);
                     //   console.log("CommonModel.canShow-3",canSee);
                    });
                }
            });

        }
        //console.log("CommonModel.canShow-4",canSee);
        return canSee;
    };

    //////////////////////////////////////////
    // This is intended to be the primary node fetching mechanism
    // for all nodes except Tag and Channels
    // We use this to pay to a nodoe's Privacy Profile
    //  Thus, userId is required
    //////////////////////////////////////////
    /**
     * Utility to fetch any kind of node
     * @param userId
     * @param {*} nodeId 
     * @param {*} callback err data
     */
    self.fetchNode = function(userId, nodeId, callback) {
        console.log("CommonModel.fetchNode",nodeId);
        Database.fetchData(nodeId, function(err, node) {
            console.log("CommonModel.fetchNode-1",err,nodeId,node);
            if (!node) { // doesn't exist unless there's an err
                return callback(err, node);
            } else {
                var canShow = self.canShow(userId, node);
                console.log("CommonModel.fetchNode-2",nodeId,userId,canShow);
                if (canShow) {
                    return callback(err, node);
                } else {
                    return callback(constants.INSUFFICIENT_CREDENTIALS, null);
                }
            }
        });
    };

    /** 
     * Here because this node does have a childList. The game is to populate this node's
     * list of relation.
     */
    self.populateConnectionStructs = function(userId, node, callback) {
        var kids = [];
        var childList = node.relations;
        console.log("CommonModel.populateConnectionStruct",childList);
        var struct;
        childList.forEach(function(kid) {
            //fetch the connection
            self.fetchNode(userId, kid, function(err, connection) {
                console.log("CommonModel.populateConnectionStruct1",childList,kid,connection,err);
                
                
                if (connection) {
                    var rlnType = connection.actualRelationType;
                    if (!rlnType) {
                        rlnType = connection.statement;
                    }
                    //Note: we hide the actual relation type in its statement
                    Database.fetchConnectionResource(rlnType, function(err, resource) {
                        console.log("CommonModel.populateConnectionStruct-2",err,resource);
                        //is this node a source or target?
                        var isSource = (connection.sourceNode === node.id);
                        var otherId;
                        if (isSource) {
                            otherId = connection.targetNode;
                        } else {
                            otherId = connection.sourceNode;
                        }
                        //fetch Other
                        self.fetchNode(userId, otherId, function(err, other) {
                            if (other) {
                                struct = {};
                                struct.id = kid;
                                struct.type = connection.type;
                                struct.img = connection.imgsm;
                                struct.creatorId = connection.creatorId;
                                if (isSource) {
                                    struct.statement = resource.asSource+other.statement;
                                } else {
                                    struct.statement = resource.asTarget+other.statement;
                                }
                                kids.push(struct);
                            }
                        });
                    });
                }
            });
        });
        return callback(kids);
    };

    /**
     * Returns a list of structs
     * @param {*} userId 
     * @param {*} childList 
     * @param {*} callback list of struct
     */
    self.grabChildStructs = function (userId, childList, callback) {
        var kids = [];
        childList.forEach(function(kid) {
            self.fetchNode(userId, kid, function(err, node) {
                console.log("CommonModel.grabChildStructs",childList,kid,node,err);
                if (!err) {
                    struct = {};
                    struct.id = node.id;
                    struct.type = node.type;
                    struct.img = node.imgsm;
                    struct.creatorId = node.creatorId;
                    struct.statement = node.statement;
                    if (node.isProCon) {
                        struct.isProCon = true;
                    }
                    kids.push(struct);
                }
            });
        });
        return callback(kids);
    };

    /**
     * 
     * @param {*} userId
     * @param name
     * @param {*} childList 
     * @param {*} callback kidstruct
     */
    function grabKids(userId, name, childList, callback) {
        var result = {};
        var struct;
        self.grabChildStructs(userId, childList, function(kids) {
             result[name] = kids;
             console.log("CommonModel.grabKids",name,childList,kids,result);
             return callback(result);
        })
    };

    /**
     * 
     * @param {*} userId 
     * @param {*} node 
     * @param {*} callback parentstruct
     */
    self.buildParent = function(userId, node, callback) {
        var result;
        if (node.parent) {
            self.fetchNode(userId, node.parent, function(err, node) {
                if (!err) {
                    var struct = {};
                    struct.id = node.id;
                    struct.type = node.type;
                    struct.img = node.imgsm;
                    struct.creatorId = node.creatorId;
                    struct.statement = node.statement;
                    return callback(struct);
               } else {
                   return callback(result);
               }
            })
        } else {
            return callback(result);
        }
    };

    self.buildTagChildList = function(userId, tag, callback) {
        console.log("CommonModel.buildTagChildList",tag);
        var result = [];
        var childList = tag.tags;
        if (tag.type === constants.PERSONAL_TAG_NODE_TYPE) {
            childList = tag.personaltags;
        }
        console.log("CommonModel.buildTagChildList-1",childList);
        if (childList) {
            self.grabChildStructs(userId, childList, function(struct) {
                result = struct;
            });
        }
        console.log("CommonModel.buildTagChildList-2",result);
        return callback(result);
    };

    /**
     * Build a child list for given node. Will not include nodes where
     * insufficient credentials exist.
     * Builds structs for viewing
     * NOTE: this function serves the purpose of a complex database JOIN
     * @param {*} userId 
     * @param {*} node 
     * @param {*} callback node
     */
    self._populateNode = function(userId, node, callback) {
        console.log("CommonModel._populateNode",node);
        var result = [];
        var childList = node.questions;
        if (!node.theQuestions) {
            if (childList) {
                self.grabChildStructs(userId, childList, function(struct) {
                    if (struct) {
                        node.theQuestions = struct;
                    }
                });
            }
        }
        if (!node.theAnswers) {
            childList = node.answers;
            if (childList) {
                self.grabChildStructs(userId, childList, function(struct) {
                    if (struct) {
                        node.theAnswers = struct;
                    }
                    console.log("CommonModel.Populate answers",childList, struct);
                });
            }
        }
        
        if (!node.thePros) {
            childList = node.proargs;
            
            if (childList) {
                self.grabChildStructs(userId, childList, function(struct) {
                    
                    if (struct) {
                     node.thePros = struct;
                    }
                });
            }
        }
        if (!node.theCons) {
            childList = node.conargs;
            if (childList) {
                self.grabChildStructs(userId, childList, function(struct) {
                    if (struct) {
                        node.theCons = struct;
                    }
                });
            }
        }
        
        if (!node.theNotes) {
            childList = node.notes;
            
            if (childList) {
                self.grabChildStructs(userId, childList, function(struct) {
                    
                    if (struct) {
                        node.theNotes = struct;
                    }
                });
            }
        }
        if (!node.theReferences) {
            childList = node.references;
            if (childList) {
                self.grabChildStructs(userId, childList, function(struct) {
                    if (struct) {
                        node.theReferences = struct;
                    }
                });
            }
        }
        
        if (!node.theRelations) {
            childList = node.relations;
            
            if (childList) {
                self.populateConnectionStructs(userId, node, function(struct) {
                    console.log("ABCDE-2",struct);
                    if (struct) {
                        node.theRelations = struct;
                    }
                });
            }
        }
        //console.log("CommonModel._populate tags",node.theTags);
        if (!node.theTags) {
            childList = node.tags;
            if (childList) {
                self.grabChildStructs(userId, childList, function(struct) {
                    if (struct) {
                        node.theTags = struct;
                    }
                });
            }
        }

        /////////////////////////////////
        // TODO might be able to optimize since these only relate to user nodes
        console.log("ABCDE",node.theNodes);
        if (!node.theNodes) {  // user nodes
            childList = node.nodes;
            console.log("ABCDE-1",childList);
            if (childList) {
                self.grabChildStructs(userId, childList, function(struct) {
                    if (struct) {
                        node.theNodes = struct;
                    }
                });
            }
        }

        if (!node.theInbox) {  // user nodes
            childList = node.inbox;
            console.log("ABCDE-2",childList);
            if (childList) {
                self.grabChildStructs(userId, childList, function(struct) {
                    if (struct) {
                        node.theInbox = struct;
                    }
                });
            }
        }
        //
        //////////////////////////////////
 
        //if (!node.thePersonalTags) { THESE ARE PRIVATE--MUST BE POPULATED EACH TIME
            childList = node.personaltags;
            if (childList) {
                self.grabChildStructs(userId, childList, function(struct) {
                    if (struct) {
                        node.thePersonalTags = struct;
                    }
                });
            }
       // }
        return callback(node);
 
   };

   /**
    * Populate with theParent and theChildren
    * @param {*} userId 
    * @param {*} node 
    * @param {*} callback 
    */
   self.populateNode = function(userId, node, callback) {
       console.log("CommonModel.populateNode",node);
       self.buildParent(userId, node, function(theParent) {
            if (theParent) {
               node.theParent = theParent;
            }
            self._populateNode(userId, node, function(result) {
                
                return callback(result);
            });
       })

   };

//////////////////////////////////
// Node fabrication and manipulation
//////////////////////////////////


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
        } else if (type === constants.PERSONAL_TAG_NODE_TYPE) {
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
        } else if (type === constants.DM_NODE_TYPE) {
            return ""; // NO ICOON YET
        } else if (type === constants.USER_NODE_TYPE) {
            return "/images/person_sm.png"; // NO ICOON YET
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
        } else if (type === constants.PERSONAL_TAG_NODE_TYPE) {
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
        } else if (type === constants.USER_NODE_TYPE) {
            return "/images/person.png"; // NO ICOON YET
        } else if (type === constants.CHANNEL_NODE_TYPE) {
            return ""; // NO ICON YET
        } else if (type === constants.DM_NODE_TYPE) {
            return ""; // NO ICOON YET
        } else {
            console.log("CommonModel.nodeTolargeIcon ERROR",type);
            throw "Bad Type 2: "+type;
        }
    };

    /**
     * Core node creation function
     * NOTE: if node is private, this does not add an ACL list:
     *   That's the caller's responsibility
     * @param nodeId  can be null
     * @param {*} creatorId
     * @param creatorHandle
     * @param {*} type 
     * @param {*} statement 
     * @param {*} details 
     * @param isPrivate
     * @param callback json
     */
    self.newNode = function(nodeId, creatorId, creatorHandle, type, statement,
                details, isPrivate, callback) {
        console.log("CommonModel.newNode"+creatorId,type, creatorHandle);
        //craft the node
        var result = {},
            ix = nodeId;
        if (!ix) {
            ix = self.newId();
        }
        result.id = ix;
        result.creatorId = creatorId;
        result.createdDate = self.newDate();
        result.version = self.newId();
        result.type = type;
        result.handle = creatorHandle;
        result.img = self.nodeTolargeIcon(type);
        result.imgsm = self.nodeToSmallIcon(type);
        result.statement = statement;
        result.isPrivate = isPrivate;
        result.details = details;
        //tell the user about it
        if (creatorId !== constants.SYSTEM_USER) {
            Database.fetchUser(creatorId, function(err, usr) {
                var nodes = usr.nodes;
                if (!nodes) {
                    nodes = [];
                }
                nodes.push(ix);
                usr.nodes = nodes;
                usr.theNodes = null;
                usr.version = self.newId();
                Database.saveUserData(creatorId, usr, function(err) {
                    EventLogModel.registerEvent(creatorId, creatorHandle, constants.NEW_NODE_EVENT, result, function(err) {
                        console.log("CommonModel.newNode",creatorId,type,result);
                        return callback(result);
                    });
                });

            });
        } else {
            EventLogModel.registerEvent(creatorId, creatorHandle, constants.NEW_NODE_EVENT, result, function(err) {
                console.log("CommonModel.newNode",creatorId,type,result);
                return callback(result);
            });
        }
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
        } else {
            x = node.answers;
            if (x) {
                return true;
            } else {
                x = node.pros;
                if (x) {
                    return true;
                } else {
                    x = node.cons;
                    if (x) {
                        return true;
                    } else {
                        return false; // default
                    }
                }
            }
        }
    };

    function sameStatements(json, node) {
        return (json.title === node.statement);
    };

    /**
     * json could include statement, details, url, ...
     * @param userId
     * @param userHandle
     * @param {*} json 
     * @param {*} callback err
     */
    self.updateNode = function(userId, userHandle, json, callback) {
        var nodeId = json.hidden_1,
            version = json.hidden_2;
        //fetch the node being edited
        self.fetchNode(userId, nodeId, function(err, oldNode) {
            if (err) {
                return callback(err);
            } else {
                //deal with statement
                //Can edit only if node has NO IBIS children
                var sameLabels = sameStatements(json, oldNode);
                var hasIBISKids = self.hasIBISChildren(oldNode);
                console.log("CommonModel.updateNode",sameLabels,hasIBISKids,json,oldNode);
                if (!sameLabels) {
                    if (!hasIBISKids) {
                        oldNode.statement = json.title;
                    }
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
                    return callback(err);
                });
            }
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
            } else if (type === constants.PERSONAL_TAG_NODE_TYPE) {
                result = node.personaltags;
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
        } else if (type === constants.PERSONAL_TAG_NODE_TYPE) {
            node.personaltags = list;
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
     * Add a child to a given node
     * @param {*} childType 
     * @param creatorId
     * @param {*} theChildNode 
     * @param {*} targetNode 
     */
    self.addChildToNode = function(childType, creatorId, theChildNode, targetNode) {
        console.log("CommonModel.addChildToNode",childType,theChildNode,targetNode);
        var kids = self.getChildList(childType, targetNode);
        if (!kids) {
            kids = [];
        }
        if (!kids.includes(theChildNode.id)) {
            kids.push(theChildNode.id);
            self.setChildList(childType, kids, targetNode);
        }
        //snappers are an index into every node that carries the child's struct
        //Tag nodes don't get snappers
        if (theChildNode.type !== constants.TAG_NODE_TYPE) {
            var snappers = theChildNode.snappers;
            if (!snappers) {
                snappers = [];
            }
            if (!snappers.includes(targetNode.id)) {
                snappers.push(targetNode.id);
                theChildNode.snappers = snappers;
            }
        }
        var canDo = true;
        if (targetNode.type === constants.TAG_NODE_TYPE ||
            targetNode.type === constants.PERSONAL_TAG_NODE_TYPE ||
            targetNode.type === constants.CHANNEL_NODE_TYPE ||
            theChildNode.type === constants.TAG_NODE_TYPE ||
            theChildNode.type === constants.PERSONAL_TAG_NODE_TYPE ||
            theChildNode === constants.CHANNEL_NODE_TYPE ||
            theChildNode === constants.DM_NODE_TYPE) {
            canDo = false;
        }
        if (canDo) {
            //DANGER: assuming one parent
            theChildNode.parent = targetNode.id;
        }
    };
};
//noticed that if you call a class > 1 times, best to
// just send a singleton
if (!instance) {
    instance = new Common();
}
module.exports = instance;
