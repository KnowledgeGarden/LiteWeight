var constants = require('../constants');
var Database = require('../drivers/file_database_driver');
var CommonModel;
var Connection,
    instance;

Connection = function() {
    var self = this;

    self.inject = function(commModel) {
        CommonModel = commModel;
        console.log("ConnectionModel",this);        
    };

    self.fetchConnection = function(id, callback) {
        console.log("ConnectionModel.fetchConnection",id);
        Database.fetchConnection(id, function(err, data) {
            return callback(err, data);            
        });
    };

    self.listConnections = function() {
        var fileNames= Database.listConnections();
        console.log("LISTS",fileNames);
        var result = [],
            temp,
            con;
        if (fileNames.length === 0) {
            return result;
        }
        fileNames.forEach(function(fx) {
            if (fx) {
                if (!fx.includes(".DS_Store")) { // mac file system
                    self.fetchConnection(fx, function(err, thecon) {
                        CommonModel.validateNodeImage(thecon, function() {
                            console.log("FC", fx, thecon);
                            con = {};
                            con.id = thecon.id;
                            con.img = thecon.imgsm;
                            con.statement = thecon.statement;
                            result.push(con);
                        });
                    });
                }
            }
        });
        return result;
    };
    ///////////////////
    //{ source: '1514850286436',target: '1514849576267',select: 'ImpliesRelationType', 'isPrivate':false }
    // Each node in a relation gets its own relation link to a single relation node
    // We craft a relation node identity based on source, relationType, and target
    //  which makes it content-addressable.
    // That supports a policy: no duplicate relations allowed
    ///////////////////

    /**
     * Will return a "Duplicate" error message if the connection already exists
     * @param {*} creatorId 
     * @param {*} jsonBody 
     * @param {*} callback err
     */
    self.createConnection = function(creatorId, jsonBody, callback) {
        console.log("ConnectionModel.createConnection",creatorId, jsonBody);
        var isPrivate = jsonBody.isPrivate;
        isPrivate = (isPrivate === 'true');
        var relnId = jsonBody.source+"."+jsonBody.selected+"."+jsonBody.target;
        Database.fetchConnection(relnId, function(err, data) {
            if (data) { //error -- already exists
                return callback("Duplicate", data);
            } else { // build the connection
                //fetch this connectionType's description
                Database.fetchConnectionResource(jsonBody.selected, function(err, resource) {
                    console.log("ConnectionModel.createConnection",jsonBody.selected, resource);
                    //fetch source
                    Database.fetchData(jsonBody.source, function(err, sourceNode) {
                        //fetch target
                        Database.fetchData(jsonBody.target, function(err, targetNode) {
                            //craft a relation node
                            var label = jsonBody.selected;
                            var details = sourceNode.statement+" "+resource.asSource+targetNode.statement;
                            CommonModel.newNode(relnId, creatorId, constants.RELATION_NODE_TYPE,
                                    label, details, isPrivate, function(json) {
                                //wire the relation node
                                var struct={};
                                struct.id = sourceNode.id;
                                struct.img = CommonModel.nodeToSmallIcon(sourceNode.type);
                                struct.type = sourceNode.type;
                                struct.statement = sourceNode.statement;
                                json.sourceNode = struct;
                                console.log("ConnectionModel.createConnection-1",struct);
                                struct = {};
                                struct.id = targetNode.id;
                                struct.img = CommonModel.nodeToSmallIcon(targetNode.type);
                                struct.type = targetNode.type;
                                struct.statement = targetNode.statement;
                                json.targetNode = struct;
                                console.log("ConnectionModel.createConnection-2",struct);
                                //wire the source node
                                var img = CommonModel.nodeToSmallIcon(constants.RELATION_NODE_TYPE);
                                struct = {};
                                struct.id = relnId;
                                struct.img = img;
                                struct.statement = resource.asSource+targetNode.statement;
                                struct.type = json.type;
                                var lx = CommonModel.getChildList(constants.RELATION_NODE_TYPE, sourceNode);
                                lx.push(struct);
                                console.log("ConnectionModel.createConnection-3",lx);
                                CommonModel.setChildList(constants.RELATION_NODE_TYPE, lx, sourceNode);
                                //wire the target node;
                                label = resource.asTarget+sourceNode.statement;
                                struct = {};
                                struct.id = relnId;
                                struct.img = img;
                                struct.statement = label;
                                struct.type = json.type;
                                lx = CommonModel.getChildList(constants.RELATION_NODE_TYPE, targetNode);
                                lx.push(struct);
                                console.log("ConnectionModel.createConnection-4",lx);
                                CommonModel.setChildList(constants.RELATION_NODE_TYPE, lx, targetNode);
                                //save the nodes
                                Database.saveConnectionData(relnId, json, function(err) {
                                    Database.saveData(sourceNode.id, sourceNode, function(err) {
                                        Database.saveData(targetNode.id, targetNode, function(err) {
                                            return callback(err);
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            }
        });
    };
};
if (!instance) {
    instance = new Connection();
}
module.exports = instance;
