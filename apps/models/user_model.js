/* @author park */
var constants = require('../constants');
var Database = require('../drivers/file_database_driver');
var CommonModel;
var User,
    instance;

User = function() {
    var self = this;

    self.inject = function(commModel) {
        CommonModel = commModel;
        console.log("JournalModel",this);        
    };

};
instance = new User();
module.exports = instance;