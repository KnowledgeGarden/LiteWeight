/* @author park */
var fs = require('fs');
var constants = require('../constants');

/** Paths */
const DataPath = "./data/";
const ResourcePath = "./resources/";
const JournalPath = DataPath+"journals/";
const BookmarkPath = DataPath+"bookmarks/";
const ConnectionPath = DataPath+"connections/";
const EventLogPath = DataPath+"eventlog/";
const RecentEventsPath = EventLogPath+"recentEvents.json";
const HistoryPath = EventLogPath+"history.json";
const TagPath = DataPath+"tags/";
const ChannelPath = DataPath+"channels/";
const UserPath = DataPath+"users/";

var FileDatabase,
    instance;

FileDatabase = function() {
    var self = this;

    /**
     * Fetch a file
     * @param {*} path 
     * @param {*} callback err, data
     */
    function readFile(path, callback) {
        console.log("Database.readFile",path);
        var json,
            error;
        try {
            var f = fs.readFileSync(path);
//          console.log("Database.readFile-1",f);
            if (f) {
//              console.log("Database.readFile-2",f);
                try {
                    json = JSON.parse(f);
//                  console.log("Database.readFile-3",json);
                } catch (e) {
                    console.log("Database.readFile error",path,e);
                    error = e;
                    //e.g.
                    //Database.readFile error ./data/1514763456472 SyntaxError: Unexpected end of JSON input
                }
            }
        } catch (x) {}
//        console.log("Database.readFile-4",json);
        return callback(error, json);
    };

    /**
     * List files in a directory
     * https://gist.github.com/kethinov/6658166
     * @param {*} dir 
     * @param {*} filelist 
     */
    function walkSync(dir, filelist) {
        var files = fs.readdirSync(dir);
        filelist = filelist || [];
        files.forEach(function(file) {
           filelist.push(file);
        });
        return filelist;
    };


    ////////////////////////
    // General purpose
    //  To INTERPRET any node which can be in a conversation
    // This is an extensible function: add fetch requirements to suit
    //  We have to do this because of folder-based file types
    ////////////////////////

    /**
     * Fetch nearly any kind of node by trial and error
     * Must be extended as new apps are added
     * Note: does not presently check for Conversations (the Map node)
     * @param {*} nodeId 
     * @param {*} callback 
     */
    self.fetchData = function(nodeId, callback) {
        //assume it's a conversation
        self.fetchNode(nodeId, function(err, data) {
            if (data) {
                return callback(err, data);
            } else {
                self.fetchBookmark(nodeId, function(err1, data1) {
                    if (data1) {
                        return callback(err1, data1);
                    } else {
                        //TECHNICALLY SPEAKING, tags don't need to be here
                        self.fetchTag(nodeId, function(err2, data2) {
                            if (data2) {
                                return callback(err2, data2);
                            } else {
                                self.fetchConnection(nodeId, function(err3, data3) {
                                    if (data3) {
                                        return callback(err3, data3);
                                    } else {
                                        self.fetchJournal(nodeId, function(err4, data4) {
                                            if (data4) {
                                                return callback(err4, data4);
                                            } else {
                                                self.fetchChannel(nodeId, function(err5, data5) {

                                                    return callback(err4, data5);
                                                    //NOTE: if other models are added you must add
                                                    // their fetch methods here

                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    };

    /**
     * Save any node type
     * Must be extended as new apps are added
     * @param nodeId
     * @param json
     * @param callback err
     */    
    self.saveData = function(nodeId, json, callback) {
        console.log("Database.saveData",json);
        var type = json.type;
        if (type === constants.BOOKMARK_NODE_TYPE) {
            self.saveBookmarkData(nodeId, json, function(err) {
                return callback(err);
            });
        } else if (type === constants.RELATION_NODE_TYPE) {
            self.saveConnectionData(nodeId, json, function(err) {
                return callback(err);
            });
        } else if (type === constants.BLOG_NODE_TYPE) {
            self.saveJournalData(nodeId, json, function(err) {
                return callback(err);
            });
        } else if (type === constants.TAG_NODE_TYPE) {
            self.saveTagData(nodeId, json, function(err) {
                return callback(err);
            });
        } else if (type === constants.CHANNEL_NODE_TYPE) {
            self.saveChannelData(nodeId, json, function(err) {
                return callback(err);
            });
//        } else if (type === constants.CONVERSATION_NODE_TYPE) {
//            self.saveConversationData(nodeId, json, function(err) {
//                return callback(err);
//            });
        } else {//TODO ADD OTHER TYPES, e.g. Blog, etc
            //default conversation nodes
            self.saveNodeData(nodeId, json, function(err) {
                return callback(err);
            });
        }
    };
    ////////////////////////
    // Conversation Nodes
    ////////////////////////

    /**
     * 
     * @param {*} nodeId 
     * @param {*} callback err data
     */
    self.fetchNode = function(nodeId, callback) {
        var path = DataPath+nodeId;
        readFile(path, function(err, data) {
            return callback(err, data);
        }); 
    };

    /**
     * Save node data
     * @param id
     * @param {*} json 
     * @param {*} callback error or undefined
     */
    self.saveNodeData = function(id, json, callback) {
        console.log("DatabaseSaveNodeData",id,json);
        fs.writeFile(DataPath+id, 
                JSON.stringify(json), function(err) {
            return callback(err);
        }); 
    };

    ////////////////////////
    // Connections
    ////////////////////////

    /**
     * 
     * @param {*} nodeId 
     * @param {*} callback err data
     */
    self.fetchConnection = function(nodeId, callback) {
        var path = ConnectionPath+nodeId;
        readFile(path, function(err, data) {
            console.log("Database.fetchConnectin",nodeId,err,data);
            return callback(err, data);
        });
       
    };

    /**
     * Save node data
     * @param id
     * @param {*} json 
     * @param {*} callback error or undefined
     */
    self.saveConnectionData = function(id, json, callback) {
        console.log("DatabaseSaveConnectionData",id,json);
        fs.writeFile(ConnectionPath+id, 
                JSON.stringify(json), function(err) {
            return callback(err);
        }); 
    };

    /**
     * A connection resource is a tiny JSON file which describes
     * a particular connection type identified by <code>id</code>
     * @param {*} id 
     * @param {*} callback 
     */
    self.fetchConnectionResource = function(id, callback) {
        var path = ResourcePath+id;
        readFile(path, function(err, data) {
            return callback(err, data);
        });
    };

    self.listConnections = function() {
        return walkSync(ConnectionPath, []);
    };

    ////////////////////////
    // Channels
    ////////////////////////

    /**
     * 
     * @param {*} id 
     * @param {*} callback err data
     */
    self.fetchChannel = function(id, callback) {
        var path = ChannelPath+id;
        readFile(path, function(err, data) {
            return callback(err, data);
        });
     };

    self.saveChannelData = function(id, json, callback) {
        console.log("DatabaseSaveChannelData",id,json);
        fs.writeFile(ChannelPath+id, 
                JSON.stringify(json), function(err) {
            return callback(err);
        }); 
    };

    self.listChannels = function() {
        return walkSync(ChannelPath, []);
    };
    ////////////////////////
    // Tags
    ////////////////////////

    /**
     * 
     * @param {*} id 
     * @param {*} callback err data
     */
    self.fetchTag = function(id, callback) {
        var path = TagPath+id;
        readFile(path, function(err, data) {
            return callback(err, data);
        });
     };

    self.saveTagData = function(id, json, callback) {
        console.log("DatabaseSaveTagData",id,json);
        fs.writeFile(TagPath+id, 
                JSON.stringify(json), function(err) {
            return callback(err);
        }); 
    };

    self.listTags = function() {
        return walkSync(TagPath, []);
    };

    ////////////////////////
    // Journal
    ////////////////////////

    /**
     * 
     * @param {*} id 
     * @param {*} callback err data
     */
    self.fetchJournal = function(id, callback) {
        var path = JournalPath+id;
        readFile(path, function(err, data) {
            return callback(err, data);
        });
     };

    self.saveJournalData = function(id, json, callback) {
        console.log("DatabaseSaveJournalData",id,json);
        fs.writeFile(JournalPath+id, 
                JSON.stringify(json), function(err) {
            return callback(err);
        }); 
    };

    self.listJournal = function() {
        var raw = walkSync(JournalPath, []);
        var rev = raw.reverse();
        return rev;
    };

    ////////////////////////
    // Bookmarks
    ////////////////////////

    self.fetchBookmark = function(id, callback) {
        var path = BookmarkPath+id;
        readFile(path, function(err, data) {
            return callback(err, data);
        });
    };

    self.saveBookmarkData = function(id, json, callback) {
        console.log("DatabaseSaveBookmarkData",id,json);
        fs.writeFile(BookmarkPath+id, 
                JSON.stringify(json), function(err) {
            return callback(err);
        }); 
    };

    self.listBookmarks = function() {
        return walkSync(BookmarkPath, []);
    };

    ////////////////////////
    // Events
    ////////////////////////

    /**
     * @param struct
     * @param callback err
     */
    self.saveRecent = function(struct, callback) {
        console.log("Database.saveRecent",struct);
        readFile(RecentEventsPath, function(err, json) {
            if (!json) {
                json = [];
            }
            json.push(struct);
            fs.writeFile(RecentEventsPath, 
                    JSON.stringify(json), function(err) {
                console.log("Database.saveRecent-1",err,json);
                return callback(err);
            });         
        });
    };

    self.saveHistory = function(struct, callback) {
        console.log("Database.saveHistory",struct);
        readFile(HistoryPath, function(err, json) {
            if (!json) {
                json = [];
            }
            json.push(struct);
            fs.writeFile(HistoryPath, 
                    JSON.stringify(json), function(err) {
                console.log("Database.saveHistory-1",err,json);
                return callback(err);
            });
        });      
    };

    /**
     * Reverses order, last first
     * @param count
     * @param callback data can be empty list
     */
    self.listRecents = function(count, callback) {
        var result = [];
        readFile(RecentEventsPath, function(err, json) {
            console.log("Database.listRecents",count,json);
            if (!json) {
                return callback(result);
            }
            var rev = json.reverse();
            var len = json.length;
            if (len > count) {
                len = count;
            }
            for (var i = 0; i <len; i++) {
                result.push(json[i]);
            }
            return callback(result);
        });
    };

    self.listHistory = function(start, count, callback) {
        var result = [];
        readFile(HistoryPath, function(err, json) {
            console.log("Database.listHistory",count,json);
            if (!json) {
                return callback(result);
            }
//            var rev = json.reverse();
            var len = json.length;
            if (len > count) {
                len = count;
            }
            for (var i = start; i <len; i++) {
                result.push(json[i]);
            }
            return callback(result);
        });
    };


};
instance = new FileDatabase();
module.exports = instance;