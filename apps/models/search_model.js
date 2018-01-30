/* @author park */
var Database = require('../drivers/file_database_driver');
var CommonModel;
var constants = require('../constants');
var Search,
    instance;

Search = function() {
    var self = this;

    self.inject = function(commModel) {
        CommonModel = commModel;
    };

    ///////////////////////////////////////
    // The idea, given that this is a file-based platform:
    //  Read every node except Users, and Channels
    //  On every node, read and search the statement
    //  On every node except Tags, read and search the details
    //  Accumulate a list of node ID values
    //  Then, read that list
    //  For each node
    //      Load it
    //      examine privacy profile against userId
    //      if canShow
    //          Read it
    //          If a hit, craft a hit structure and add to a list
    //  Present that list
    //      List needs to be kept around if it is long enough for paging
    //          That entails some kind of QueryID to go with
    //              the user's session, and with a map of queries/hits
    ///////////////////////////////////////

    function nodeToHit(node) {
        var result = {};
        result.id = node.id;
        result.img = node.imgsm;
        result.statement = node.statement;
        return result;
    };
    /**
     * 
     * @param {*} query 
     * @param {*} node
     * @returns null or struct
     */
    function searchNode(query, node) {
        var q = query.toLowerCase();
        var str = node.statement.toLowerCase();
        var where = str.indexOf(q);
        console.log("SearchModel.searchNode",where,query,str);
        if (where > -1) {
            return nodeToHit(node);
        } else if (node.type !== constants.TAG_NODE_TYPE) {
            str = node.details.toLowerCase();
            where = str.indexOf(q);
            console.log("SearchModel.searchNode-1",where,query,str);
            if (where > -1) {
                return nodeToHit(node);
            } else {
                return null;
            }
        } else {
            return null;
        }
    };
    /**
     * Fetch the node at the file
     * look at privacy profile
     * search if it's available
     * @param {*} userId 
     * @param {*} query 
     * @param {*} filename 
     * @param {*} callback error json
     */
    function testForHit(userId, query, filename, callback) {
        console.log("SearchModel.testforHit",userId,filename);
        CommonModel.fetchNode(userId, filename, function(err, node) {
            var result;
            console.log("SearchModel.testForHit",filename,err,node);
            if (node) {
                result = searchNode(query, node);
            }
            console.log("SearchModel.testforHit-1",filename,result);
            return callback(null,result);
        });
    };
    /**
     * The entry point
     * @param {*} userId 
     * @param {*} query 
     * @param {*} callback err, list
     */
    function acquireHits(userId, query, callback) {
        var fileList = Database.scourDatabase();
        var result = [];
        var error;
        // works to here
        fileList.forEach(function(filename) {
            testForHit(userId, query, filename, function(err, hit) {
                if (hit) {
                    result.push(hit)
                }
            });

        });
        return callback(error, result);
    };
    /**
     * Returns a list of {id, img, statement}
     * @param {*} userId 
     * @param {*} query 
     * @param start
     * @param count
     * @param {*} callback a list
     */
    self.search = function(userId, query, start, count, callback) {
        console.log("SearchModel.search",userId,query);
        var result = [];
        acquireHits(userId, query, function(err, hits) {
            if (hits) {
                result = hits;
            }
            return callback(result);
        });
    };

};
if (!instance) {
    instance = new Search();
}
module.exports = instance;
