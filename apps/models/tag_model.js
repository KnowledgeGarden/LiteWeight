/* @author park */
var Database = require('../drivers/file_database_driver');
var CommonModel;
var constants = require('../constants');
var Tags,
    instance;

Tags = function() {
    var self = this;

    self.inject = function(commModel) {
        CommonModel = commModel;
    //    console.log("TagModel",environment,CommonModel);
    }

    /**
     * Fetch a tag
     * @param {*} viewId 
     * @param {*} callback err json
     */
    self.fetchTag = function(id, callback) {
        console.log("TagModel.fetchTag", id);
        Database.fetchTag(id, function(err, data) {
            return callback(err, data);            
        });
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

    function labelToId(label) {
        var result = CommonModel.replaceAll(label, ' ', '_');
        result = result.toLowerCase();
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
        console.log("TagModel.wireTagNode", node, tag);
        CommonModel.addStructToNode(constants.TAG_NODE_TYPE, creatorId, node, tag);
        CommonModel.addStructToNode(constants.TAG_NODE_TYPE, creatorId, tag, node);
        console.log("TagModel.wireTagNode-1",tag,node);
        Database.saveTagData(tag.id, tag, function(err) {
            return callback(err);
        });
    };

    /**
     * We are defining a tag against a particular node.
     * If that tag already exists, we don't make it again;
     *   instead, we simply add the new node to its list of nodes
     * FOR NOW, all tags are public
     * @param creatorId
     * @param {*} tagLabel 
     * @param {*} node 
     * @param {*} callback err
     */
    self.newTag = function(creatorId, tagLabel, node, callback) {
        if (tagLabel === '') {
            return callback("Missing tag label");
        }
        //label to tag id
        var id = labelToId(tagLabel);
        //Do we already have this tag?
        Database.fetchTag(id, function(err, aTag) {
            console.log("TagModel.newTag",tagLabel,id,aTag);
            if (aTag) {
                wireTagNode(aTag, creatorId, node, function(err) {
                    console.log("TagModel.newTag-1",aTag);
                    return callback(err);
                });
            } else { // new tag
                CommonModel.newNode(id, creatorId, constants.TAG_NODE_TYPE, tagLabel, "", false, function(theTag) {
                    wireTagNode(theTag, creatorId, node, function(err) {
                        console.log("TagModel.newTag-2",theTag,node);
                        return callback(err);
                    });
                });
            }
        });
    };

    function tagHandler(tagNameArray, creatorId, node, callback) {
        var error;
        function next() {
            console.log("TagModel.tagHandler",tagNameArray);
            if (tagNameArray.length === 0) {
                return callback(error);
            }
            lx = tagNameArray.pop();
            if (lx && lx !== '') {
                console.log("TagModel.tagHandler-1",lx,tagNameArray);
                self.newTag(creatorId, lx, node, function(err) {
                    if (!error && err) {
                        error = err;
                    }
                    next();
                });
            } else {
                next();
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
    self.addTags = function(creatorId, tagLabel, selectedLabels, nodeId, callback) {
        console.log("TagModel.addTags",tagLabel, selectedLabels);
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
        console.log("TagModel.addTags-1",labelArray);
        Database.fetchData(nodeId, function(err, node) {

            var type = node.type;
            tagHandler(labelArray, creatorId, node, function(error) {
                //update the node's version
                node.version = CommonModel.newId();
                console.log("TagModel.addTags-3",node);
                //save the node
                Database.saveData(nodeId, node, function(err) {
                    return callback(error, type);
                });
            });
        });
    }

    self.listTags = function() {
        var fileNames = Database.listTags();
        console.log("TagModel.listTags",fileNames);
        var result = [],
            temp,
            con;
        if (fileNames.length === 0) {
            return result;
        }
        fileNames.forEach(function(fx) {
            if (!fx.includes(".DS_Store")) { // mac file system
                self.fetchTag(fx, function(err, thecon) {
                    console.log("TFE", fx, thecon);
                    con = {};
                    con.id = thecon.id;
                    con.img = thecon.imgsm;
                    con.statement = thecon.statement;
                    result.push(con);
                });
            }
        });
        return result;

    };

};
if (!instance) {
    instance = new Tags();
}
module.exports = instance;