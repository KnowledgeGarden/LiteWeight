/* @author park */
var Database = require('../drivers/file_database_driver');
var CommonModel;
var constants = require('../constants');
var PersonalTags,
    instance;

    PersonalTags = function() {
    var self = this;

    self.inject = function(commModel) {
        CommonModel = commModel;
    //    console.log("TagModel",environment,CommonModel);
    };

    /**
     * Fetch a tag
     * @param userId
     * @param {*} viewId 
     * @param {*} callback err json
     */
    self.fetchTag = function(userId, id, callback) {
        
        Database.fetchPersonalTag(id, function(err, data) {
            if (CommonModel.canShow(userId, data)) {
                console.log("PersonalTagModel.fetchTag", id);
                CommonModel.buildTagChildList(userId, data, function(children) {
                        data.theTags = children;
                        return callback(err, data);
                });
            } else {
                return callback(null, null);
            }
        });
    };

    //https://stackoverflow.com/questions/1137436/what-are-useful-javascript-methods-that-extends-built-in-objects/1137579#1137579
    String.prototype.replaceAll = function(search, replace)
    {
        //if replace is not sent, return original string otherwise it will
        //replace search string with 'undefined'.
        if (replace === undefined) {
            return this.toString();
        } else {
            return this.replace(new RegExp('[' + search + ']', 'g'), replace);
        }
    };

    /**
     * Personal tags run the risk of having the same label, so we append creatorId
     * @param {*} label 
     * @param {*} creatorId 
     */
    function labelToId(label, creatorId) {
        var result = CommonModel.replaceAll(label, ' ', '_');
        result = result.toLowerCase()+"_"+creatorId;
        return result;
    };

    /////////////////////
    // When a node is tagged, both the node and the
    // tag know about it, using the "tags" field in each
    ////////////////////
    /**
     * Wire tag to node
     * Don't save the node data since it will be saved
     * by the calling stack
     * @param {*} tag
     * @param creatorId
     * @param {*} node 
     * @param {*} callback 
     */
    function wireTagNode(tag, creatorId, node, callback) {
        console.log("PersonalTagModel.wireTagNode", node, tag);
        CommonModel.addChildToNode(constants.PERSONAL_TAG_NODE_TYPE, creatorId, node, tag);
        CommonModel.addChildToNode(constants.PERSONAL_TAG_NODE_TYPE, creatorId, tag, node);
        console.log("PersonalTagModel.wireTagNode-1",tag,node);
        tag.theTags = null;
        Database.savePersonalTagData(tag.id, tag, function(err) {
            return callback(err);
        });
    };

    /**
     * We are defining a tag against a particular node.
     * If that tag already exists, we don't make it again;
     *   instead, we simply add the new node to its list of nodes
     * ALL Personal Tags are private
     * @param creatorId
     * @param creatorHandle
     * @param {*} tagLabel 
     * @param {*} node 
     * @param {*} callback err
     */
    self.newTag = function(creatorId, creatorHandle, tagLabel, node, callback) {
        if (tagLabel === '') {
            return callback("Missing tag label");
        } else {
            //label to tag id
            var id = labelToId(tagLabel, creatorId);
            //Do we already have this tag?
            Database.fetchPersonalTag(id, function(err, aTag) {
                console.log("PersonalTagModel.newTag",tagLabel,id,aTag);
                if (aTag) {
                    wireTagNode(aTag, creatorId, node, function(err) {
                        console.log("PersonalTagModel.newTag-1",aTag);
                        return callback(err);
                    });
                } else { // new tag  all tags are public
                    CommonModel.newNode(id, creatorId, creatorHandle, constants.PERSONAL_TAG_NODE_TYPE, tagLabel, "", true, function(theTag) {
                        var acls = [];
                        acls.push(creatorId);
                        theTag.acls = acls;
                        wireTagNode(theTag, creatorId, node, function(err) {
                            console.log("PersonalTagModel.newTag-2",theTag,node);
                            return callback(err);
                        });
                    });
                }
            });
        }
    };

    function tagHandler(tagNameArray, creatorId, creatorHandle, node, callback) {
        var error;
        function next() {
            console.log("PersonalTagModel.tagHandler",tagNameArray);
            if (tagNameArray.length === 0) {
                return callback(error);
            } else {
                lx = tagNameArray.pop();
                if (lx && lx !== '') {
                    console.log("PersonalTagModel.tagHandler-1",lx,tagNameArray);
                    self.newTag(creatorId, creatorHandle, lx, node, function(err) {
                        if (!error && err) {
                            error = err;
                        }
                        next();
                    });
                } else {
                    next();
                }
            }
        }
        //kickstart
        next();
    };

    /**
     * Handle a new tag event, which can include one or several selected tags
     * @param {*} creatorId 
     * @param {*} tagLabel 
     * @param {*} selectedLabels comma separated list
     * @param {*} nodeId 
     * @param {*} callback err. nodetype
     */
    self.addTags = function(creatorId, creatorHandle, tagLabel, selectedLabels, nodeId, callback) {
        console.log("PersonalTagModel.addTags",tagLabel, selectedLabels,nodeId);
        var ta = selectedLabels.split(',');
        var labels = tagLabel;
        var len = ta.length;
        var labelArray = [];
        labelArray.push(tagLabel);
        if (len > 0) {
            for (var i=0;i<len;i++) {
                labelArray.push(ta[i].trim());
            }
        }
        console.log("PersonalTagModel.addTags-1",labelArray);
        CommonModel.fetchNode(creatorId, nodeId, function(err, node) {

            var type = node.type;
            tagHandler(labelArray, creatorId, creatorHandle, node, function(error) {
                //update the node's version
                node.version = CommonModel.newId();
                console.log("PersonalTagModel.addTags-3",node);
                //save the node
                node.thePersonalTags = null;
                Database.saveData(nodeId, node, function(err) {
                    return callback(error, type);
                });
            });
        });
    };

    /////////////////////////////////
    // TagClustering means
    //  array of nodes  Tags
    //      { id, label, shape }
    //  array of edges
    //      { fromId, toId }
    //
    /////////////////////////////////

    function tagStruct(tag) {
        var result = {};
        result.id = tag.id;
        result.label = tag.statement;
        result.shape = "oval";
        return result;
    };

    function edgeStruct(fromId, toId) {
        var result = {};
        result.from = fromId;
        result.to = toId;
        return result;
    };

    function fetchNodesForTag(userId, tag, callback) {
        var nodeList = tag.personaltags;
        var result = [];
        nodeList.forEach(function(nodeId) {
            console.log("PersonalTagModel.fetchNodesForTag",nodeId);
            CommonModel.fetchNode(userId, nodeId, function(err, node) {
                console.log("PersonalTagModel.fetchNodesForTag-1",err, node);
                if (node) {
                    result.push(node);
                }
            });
        });
        return callback(result);
    };

    function nodeArrayContains(json, array) {
        var len = array.length,
            jo;
        for (var i = 0; i< len; i++) {
            jo = array[i];
            if (jo.id === json.id) {
                return true;
            }
        }
        return false;
    };

    function edgeArrayContains(json, array) {
        var len = array.length,
            jo;
        for (var i = 0; i< len; i++) {
            jo = array[i];
           // console.log("TagModel.edgeArrayContains", jo.from, json.from, jo.to,json.to);
            if ((jo.from === json.from) &&
                (jo.to === json.to) ||
                (jo.to === json.from) &&
                (jo.from === json.to)) {
            //    console.log("TagModel.edgeArrayContains true");
                return true;
            }
        }
        //console.log("TagModel.edgeArrayContains false");
        return false;
    };
    /**
     * Return a JSON object which can paint a D3.js graph of tag clusters
     * @param userId
     * @param callback json
     */
    self.clusterTags = function(userId, callback) {
        var fileNames = Database.listPersonalTags();
        console.log("PersonalTagModel.listPersonalTags",fileNames);
        var result = [],
            tagDocsSet = [],
            tagListSet = [],
            edgeListSet = [],
            workingTag,
            workingTagNodes,
            temp = [],
            workingEdge,
            where;
        if (fileNames.length === 0) {
            return callback(null, result);;
        } else {
            fileNames.forEach(function(fx) {
                if (!fx.includes(".DS_Store")) { // mac file system
                    //1- fetch this tag
                    // Since they are private, this is filtered
                    CommonModel.fetchNode(userId, fx, function(err, tag) {
                        console.log("PersonalTagModel.clusterTags",tag);
                        // get its JSON struct
                        if (tag) {
                            workingTag = tagStruct(tag);
                            if (!nodeArrayContains(workingTag, tagListSet)) {
                                tagListSet.push(workingTag);
                            }
                            console.log("PersonalTagModel.clusterTags-1A",workingTag);
                            //fetch nodes for this tag 
                            fetchNodesForTag(userId, tag, function(nodelist) {
                                workingTagNodes = nodelist;
                                console.log("PersonalTagModel.clusterTags-1",nodelist);
                                //That constitutes every node *this* tag touches.
                                // We now pair this tag with arcs to those tags.
                                workingTagNodes.forEach(function(node) {
                                    temp = node.personaltags;
                                    console.log("PersonalTagModel.clusterTags-2",temp);
                                    if (temp) {
                                        temp.forEach(function(tagId) {
                                            if (tagId !== tag.id) {
                                                workingEdge = edgeStruct(tag.id, tagId);
                                            
                                                if (!edgeArrayContains(workingEdge, edgeListSet)) {
                                                    edgeListSet.push(workingEdge);
                                                }
                                            };
                                        });
                                    }

                                });
                            });
                        }
                    });
                }
            });
            var result = {};
            result.nodes = tagListSet;
            result.edges = edgeListSet;
            return callback(result);
        }
    };

    self.listTags = function(userId) {
        var fileNames = Database.listPersonalTags();
        console.log("PersonalTagModel.listTags",fileNames);
        var result = [],
            temp,
            con;
        if (fileNames.length === 0) {
            return result;
        } else {
            fileNames.forEach(function(fx) {
                if (!fx.includes(".DS_Store")) { // mac file system
                    self.fetchTag(userId, fx, function(err, thecon) {
                        console.log("TPFE", fx, thecon);
                        if (thecon) {
                            result.push(thecon);
                        }
                    });
                }
            });
            return result;
        }

    };
};
if (!instance) {
    instance = new PersonalTags();
}
module.exports = instance;
