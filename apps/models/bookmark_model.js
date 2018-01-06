var constants = require('../constants');
var Database = require('../drivers/file_database_driver');
var CommonModel;
var Bookmark,
    instance;

Bookmark = function() {
    var self = this;

    self.inject = function(commModel) {
        CommonModel = commModel;
    //    console.log("BookmarkModel",environment,CommonModel);        
    };

    /**
     * Stash this bookmark
     * @param {*} creatorId 
     * @param {*} url 
     * @param {*} statement 
     * @param {*} callback err
     */
    self.stashBookmark = function(creatorId, url, statement, callback) {
    //        console.log("BookmarkModel.newBookmark",creatorId,url,statement);
        //fetch the bookmark channe
        Database.fetchChannel(constants.BOOKMARK_CHANNEL, function(err, channel) {
            //create a new node
            var lbl = statement;
            if (lbl === "") {
                lbl = "label missing from"+url;
            }
            CommonModel.newNode(null, creatorId, constants.BOOKMARK_NODE_TYPE, lbl, "Stashed", false, function(node) {
                node.url = url;
                CommonModel.addStructToNode(constants.BOOKMARK_NODE_TYPE, creatorId, node, channel);
                channel.version = CommonModel.newId();
                console.log("BookmarkModel.newBookmark-1",node,channel);

                Database.saveBookmarkData(node.id, node, function(err) {
                    Database.saveChannelData(channel.id, channel, function(err2) {
                        console.log("BookmarkModel.newBookmark-2",node);
                        return callback(err2);
                    });
                    });
            });
        });
    };

    /**
     * Create a new bookmark (aka WebClip)
     * Caller must pay attention to returned error in case the USL is missing
     * @param {*} creatorId 
     * @param {*} url required
     * @param {*} statement 
     * @param {*} details
     * @param isPrivate
     * @param {*} callback err, node
     */
    self.newBookmark = function(creatorId, url, statement, details, isPrivate, callback) {
//        console.log("BookmarkModel.newBookmark",creatorId,url,statement);
        //fetch the bookmark channe
        Database.fetchChannel(constants.BOOKMARK_CHANNEL, function(err, channel) {
            //create a new node
            CommonModel.newNode(null, creatorId, constants.BOOKMARK_NODE_TYPE, statement, details, isPrivate, function(node) {
                node.url = url;
                CommonModel.addStructToNode(constants.BOOKMARK_NODE_TYPE, creatorId, node, channel);
                channel.version = CommonModel.newId();
                console.log("BookmarkModel.newBookmark-1",node,channel);

                Database.saveBookmarkData(node.id, node, function(err) {
                    Database.saveChannelData(channel.id, channel, function(err2) {
                        console.log("BookmarkModel.newBookmark-2",node);
                        return callback(err2, node);
                    });
                 });
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
