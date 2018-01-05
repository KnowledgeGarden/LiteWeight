/**
 * Dependency injection for models.
 * When a new model is added, if it requires any other model, then it must
 * be included in this code.
 * The idea is to create all the models here, then inject dependencies.
 */
var CommonModel = require('./models/common_model');
var TagModel = require('./models/tag_model');
var ConversationModel = require('./models/conversation_model');
var EventLogModel = require('./models/eventlog_model');
var BookmarkModel = require('./models/bookmark_model');
var ConnectionModel = require('./models/connection_model');
var JournalModel = require('./models/journal_model');
var ChannelModel = require('./models/channel_model');
Environment = function() {
    var self = this;
    CommonModel.inject(EventLogModel);
    ConversationModel.inject(CommonModel, EventLogModel);
    TagModel.inject(CommonModel);
    EventLogModel.inject(CommonModel);
    BookmarkModel.inject(CommonModel);
    ConnectionModel.inject(CommonModel);
    JournalModel.inject(CommonModel);
    ChannelModel.inject(CommonModel, EventLogModel);
    //Bootstrap channels
    ChannelModel.bootstrapBookmarks(function(err) {
        ChannelModel.bootstrapGeneral(function(err1) {
            console.log("Channels Bootstrapped",err,err1);
        });
    });
};
module.exports = Environment;
