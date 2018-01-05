var constants = require('../constants');
var Database = require('../drivers/file_database_driver');
const environment = require('../environment');
var CommonModel; // = environment.CommonModel;
var Bookmark,
    instance;

Bookmark = function() {
    var self = this;

    self.inject = function(commModel) {
        CommonModel = commModel;
    //    console.log("BookmarkModel",environment,CommonModel);        
    };
//    console.log("Bookmark",CommonModel);
    /**
     * Create a new bookmark (aka WebClip)
     * Caller must pay attention to returned error in case the USL is missing
     * @param {*} creatorId 
     * @param {*} url required
     * @param {*} statement 
     * @param {*} details
     * @param isPrivate
     * @param {*} callback err
     */
    self.newBookmark = function(creatorId, url, statement, details, isPrivate, callback) {
//        console.log("BookmarkModel.newBookmark",creatorId,url,statement);
        CommonModel.newNode(null, creatorId, constants.BOOKMARK_NODE_TYPE, statement, isPrivate, details, function(node) {
            node.url = url;
    //        console.log("BookmarkModel.newBookmark-1"+node);
            Database.saveBookmarkData(node.id, node, function(err) {
                return callback(err);
            });
        });
    };

    self.fetchBookmark = function(id, callback) {
//        console.log("BookmarkModel.fetchBookmark",id);
        Database.fetchBookmark(id, function(err, data) {
            return callback(err, data);
        });
    };

    self.listBookmarks = function() {
        var fileNames= Database.listBookmarks();
        console.log("BookmarkModel.listBookmarks",fileNames);
        var result = [],
            temp,
            con;
        if (fileNames.length === 0) {
            return result;
        }
        fileNames.forEach(function(fx) {
            if (!fx.includes(".DS_Store")) { // mac file system
                self.fetchBookmark(fx, function(err, thecon) {
                    CommonModel.validateNodeImage(thecon, function() {
                        con = {};
                        con.id = thecon.id;
                        con.img = thecon.imgsm;
                        con.statement = thecon.statement;
                        result.push(con);
                    });
                });
            }
        });
        return result;
    };


};
if (!instance) {
    instance = new Bookmark();
}
module.exports = instance;
