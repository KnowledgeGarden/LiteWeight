/* @author park */
var fs = require('fs');
var path = require('path');
var constants = require('../constants');
var LRUCache = require("lru-cache-js");

/** Paths */
const DataPath = path.join(__dirname,"../../data/");
const AccountsPath = DataPath+"accounts/accounts.json";
const ResourcePath = "./resources/";

const BookmarkPath = DataPath+"bookmarks/";

const EventLogPath = DataPath+"eventlog/";
const RecentEventsPath = EventLogPath+"recentEvents.json";
const HistoryPath = EventLogPath+"history.json";
const TagPath = DataPath+"tags/";
const PersonalTagPath = DataPath+"personaltags/";
const ChannelPath = DataPath+"channels/";
const ConnectionPath = DataPath+"connections/";
const UserPath = DataPath+"users/";
const DM_PATH = UserPath+"dm/";
const CacheSize = 1000;

var FileDatabase,
    instance;

FileDatabase = function() {
    var self = this;
    var cache = new LRUCache(CacheSize);

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
            //fs.readFile(path, (err, f) => {
            var f = fs.readFileSync(path, 'utf8');
                console.log("Database.readFile-1",f);
                if (f) {
    //              console.log("Database.readFile-2",f);
                    try {
                        json = JSON.parse(f);
    //                  console.log("Database.readFile-3",json);
                    } catch (e) {
                        console.log("Database.readFile error",path,e,f);
                        error = e;
                        //e.g.
                        //Database.readFile error ./data/1514763456472 SyntaxError: Unexpected end of JSON input
                    }
                    
                }
                return callback(error, json);
            //});
        } catch (x) {
            //console.log("Database.readFile error2 "+x);
            error = x;
        }
        console.log("Database.readFile-4",path,json);
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

    self.removeFromCache = function(nodeId) {
        cache.remove(nodeId);
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
     * @param {*} callback err, result
     */
    self.fetchData = function(nodeId, callback) {
        //assume it's anything except tag or channel or bookmark
        self.fetchNode(nodeId, function(err, data) {
            if (data) {
                return callback(err, data);
            } else {
                //TECHNICALLY SPEAKING, tags don't need to be here
                self.fetchTag(nodeId, function(err2, data2) {
                    if (data2) {
                        return callback(err2, data2);
                    } else {
                        self.fetchChannel(nodeId, function(err3, data3) {
                            if (data3) {
                            return callback(err3, data3);
                            } else {
                                self.fetchBookmark(nodeId, function(err4, data4) {
                                    if (data4) {
                                        return callback(err4, data4);
                                    } else {
                                        self.fetchUser(nodeId, function(err5, data5) {
                                            if (data5) {
                                                return callback(err5, data5);
                                            } else {
                                                self.fetchDM(nodeId, function(err6, data6) {
                                                    if (data6) {
                                                        return callback(err6, data6);
                                                    } else {
                                                        self.fetchConnection(nodeId, function(err7, data7) {
                                                            if (data7) {
                                                                return callback(err7, data7);
                                                            } else {
                                                                self.fetchPersonalTag(nodeId, function(err8, data8) {
                                                                    return callback(err8, data8);
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
        if (type === constants.TAG_NODE_TYPE) {
            self.saveTagData(nodeId, json, function(err) {
                return callback(err);
            });
        } else if (type === constants.CHANNEL_NODE_TYPE) {
            self.saveChannelData(nodeId, json, function(err) {
                return callback(err);
            });
        } else if (type === constants.BOOKMARK_NODE_TYPE) {
            self.saveBookmarkData(nodeId, json, function(err) {
                return callback(err);
            });
        } else if (type === constants.RELATION_NODE_TYPE) {
            self.saveConnectionData(nodeId, json, function(err) {
                return callback(err);
            });

        } else if (type === constants.USER_NODE_TYPE) {
            self.saveUserData(nodeId, json, function(err) {
                return callback(err);
            });
        } else if (type === constants.DM_NODE_TYPE) {
            self.saveDMData(nodeId, json, function(err) {
                return callback(err);
            });
        } else if (type === constants.PERSONAL_TAG_NODE_TYPE) {
            self.savePersonalTagData(nodeId, json, function(err) {
                return callback(err);
            });
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
        var result = cache.get(nodeId);
        if (result) {
            return callback(null, result);
        } else {
            var path = DataPath+nodeId;
            readFile(path, function(err, data) {
                cache.put(nodeId, data);
                return callback(err, data);
            });
        }
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
            cache.put(id, json);
            return callback(err);
        }); 
    };

    ////////////////////////
    // Connections
    ////////////////////////

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

    self.fetchConnection = function(id, callback) {
        var path = ConnectionPath+id;
        readFile(path, function(err, data) {
            return callback(err, data);
        });

    };

    self.saveConnectionData = function(id, json, callback) {
        console.log("DatabaseSaveConnectionData",id,json);
        fs.writeFile(ConnectionPath+id, 
                JSON.stringify(json), function(err) {
            return callback(err);
        }); 
    };

    self.listConnections = function() {
        
        return walkSync(ConnectionPath, []);
    };

    ////////////////////////
    // Users
    ////////////////////////

    self.fetchDM = function(id, callback) {
        var path = DM_PATH+id;
        readFile(path, function(err, data) {
            return callback(err, data);
        });
     };
     self.saveDMData = function(id, json, callback) {
        console.log("DatabaseSaveDMData",id,json);
        fs.writeFile(DM_PATH+id, 
                JSON.stringify(json), function(err) {
            return callback(err);
        }); 
    };

   // self.listConnections = function() {
   //     return walkSync(ConnectionPath, []);
   // };

    /**
     * 
     * @param {*} id 
     * @param {*} callback err data
     */
    self.fetchUser = function(id, callback) {
        var path = UserPath+id;
        readFile(path, function(err, data) {
            return callback(err, data);
        });
     };

    self.saveUserData = function(id, json, callback) {
        console.log("DatabaseSaveUserData",id,json);
        fs.writeFile(UserPath+id, 
                JSON.stringify(json), function(err) {
            return callback(err);
        }); 
    };

    self.listUsers = function() {
        return walkSync(UserPath, []);
    };

    self.fetchUserByHandle = function(handle) {
        var usrs = self.listUsers();
        var len = usrs.length;
        var ux, result;
        for (var i=0; i<len; i++) {
            ux = usrs[i];
            if (ux.handle === handle) {
                result =  ux;
                break;
            }
        }
        return result;
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
    // Personal Tags
    ////////////////////////

    /**
     * 
     * @param {*} id 
     * @param {*} callback err data
     */
    self.fetchPersonalTag = function(id, callback) {
        var path = PersonalTagPath+id;
        readFile(path, function(err, data) {
            return callback(err, data);
        });
     };

    self.savePersonalTagData = function(id, json, callback) {
        console.log("DatabaseSavePersonalTagData",id,json);
        fs.writeFile(PersonalTagPath+id, 
                JSON.stringify(json), function(err) {
            return callback(err);
        }); 
    };

    self.listPersonalTags = function() {
        return walkSync(PersonalTagPath, []);
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
    // Accounts
    ////////////////////////

    self.fetchInvitations = function(callback) {
        readFile(AccountsPath, function(err, json) {
            var invitations = json.invitations;
            console.log("Database.fetchInvitations",email,invitations,json);
            return callback(err, invitations);
        });

    };

    self.compareAdminEmail = function(email, callback) {
        readFile(AccountsPath, function(err, json) {
            var isadmin = json.adminemail === email;
            
            return callback(err, isadmin);
        });
    }
    /**
     * 
     * @param {*} email 
     * @param {*} callback err, json can return null
     */
    self.fetchAccount = function(email, callback) {
        readFile(AccountsPath, function(err, json) {
            var acct = json.participants[email];
            console.log("Database.fetchAccount",email,acct,json);
            return callback(err, acct);
        });

    };

    self.saveAccount = function(email, struct, callback) {
        readFile(AccountsPath, function(err, json) {
            console.log("Database.saveAccount",json,struct);
            json.participants[email] = struct;
            console.log("Database.saveAccount-1",json);
            fs.writeFile(AccountsPath, 
                JSON.stringify(json), function(err) {
                console.log("Database.saveAccount-2",err,json);
                return callback(err);
            });
        }); 
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
            console.log("Database.saveHistory-1",err, json);
            if (!json) {
                json = [];
            }
            json.push(struct);
            console.log("Database.saveHistory-2",json);
            fs.writeFile(HistoryPath, 
                    JSON.stringify(json), function(err) {
                console.log("Database.saveHistory-3",err,json);
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

    ////////////////////////
    // Search
    ////////////////////////

    /**
     * Called by SearchModel
     * @param {*} callback 
     */
    self.scourDatabase = function(callback) {
        console.log("Database.scourDatabase");
        var result = [];
        var temp = self.listBookmarks();
        temp.forEach(function(fx) {
            if (!fx.includes(".DS_Store")) {
                result.push(fx);
            }
        });
        console.log("Database.scourDatabase-1",result);
        temp = self.listTags();
        temp.forEach(function(fx) {
            if (!fx.includes(".DS_Store")) {
                result.push(fx);
            }
        });
        console.log("Database.scourDatabase-2",result);
        ////////////////////////
        //MOTE: if you add a directory to this database, it must be added
        // to this filter
        ////////////////////////
        temp = walkSync(DataPath, []);
        temp.forEach(function(fx) {
            // must filter directories:
            // "accounts" "bookmarks" "channels" "evntlog""tags""users"
            if (!(fx.includes(".DS_Store") ||
                fx === "accounts" ||
                fx === "bookmarks" ||
                fx === "channels" ||
                fx === "eventlog" ||
                fx === "tags" ||
                fx === "personaltags" ||
                fx === "users" )) {
                result.push(fx);
            }
        });
        console.log("Database.scourDatabase-3",result);
        temp = walkSync(DM_PATH, []);
        temp.forEach(function(fx) {
            if (!fx.includes(".DS_Store")) {
                result.push(fx);
            }
        });
        console.log("Database.scourDatabase++",result);
        return result;
    };

};
instance = new FileDatabase();
module.exports = instance;