/* @author park */
var Database = require('../drivers/file_database_driver');
var CommonModel;
var ConversationModel;
var constants = require('../constants');
var ProCon,
    instance;

ProCon = function() {
    var self = this;

    self.inject = function(commModel, conModel) {
        CommonModel = commModel;
    };

//Here in case we need it
// not used anywhere

};

if (!instance) {
    instance = new ProCon();
}
module.exports = instance;
