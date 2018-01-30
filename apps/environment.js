/**
 * @author park
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
var UserModel = require('./models/user_model');
var AdminModel = require('./models/admin_model');
var SearchModel = require('./models/search_model');
var PersonalTagModel = require('./models/personaltag_model');
var InboxModel = require('./models/inbox_model');
var ProConModel = require('./models/procon_model');


Environment = function() {
    var self = this;
    CommonModel.inject(EventLogModel);
    ConversationModel.inject(CommonModel, EventLogModel, InboxModel);
    TagModel.inject(CommonModel);
    EventLogModel.inject(CommonModel);
    BookmarkModel.inject(CommonModel);
    ConnectionModel.inject(CommonModel);
    JournalModel.inject(CommonModel);
    UserModel.inject(CommonModel);
    ChannelModel.inject(CommonModel, EventLogModel);
    AdminModel.inject(CommonModel);
    SearchModel.inject(CommonModel);
    PersonalTagModel.inject(CommonModel);
    InboxModel.inject(CommonModel, UserModel);
    ProConModel.inject(CommonModel, ConversationModel);
    
    //Bootstrap channels
    ChannelModel.bootstrapBookmarks(function(err) {
        ChannelModel.bootstrapGeneral(function(err1) {
            ChannelModel.bootstrapHelp(function(err2) {
                ChannelModel.bootstrapProCon(function(err3){
                    console.log("Channels Bootstrapped",err,err1,err2,err3);
                });
            });
        });
    });
};
module.exports = Environment;
