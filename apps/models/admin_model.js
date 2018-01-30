/**
 * @author park
 */
var constants = require('../constants');
var Database = require('../drivers/file_database_driver');
var config = require('../../config/config')
var bcrypt = require('bcrypt-nodejs');
var UserModel = require('./user_model');
var CommonModel;
var Admin,
    instance;

Admin = function() {
    var self = this;

    self.inject = function(commModel) {
        CommonModel = commModel;     
    };

    /**
     * If portal is invitation only, compare email to invitations list
     * @param {*} email 
     * @param {*} callback truth
     */
    function checkIsInvitationOK(email, callback) {
        var isInvite = config.invitationOnly;
        console.log("AdminModel.checkIsInvitationOK",isInvite);
        if (!isInvite) {
            return callback(true)
        } else {
            Database.fetchInvitations(function(err, invitations) {
                var does = invitations.includes(email);
                console.log("AdminModel.checkIsInvitationOK-1",does,email,invitations);
                return callback(does);
            });
        }
    };

    /**
     * Make new User Objects
     * @param {*} email 
     * @param {*} handle 
     * @param {*} fullName 
     * @param {*} password 
     * @param {*} callback err
     */
    self.signup = function(email, handle, fullName, password, callback) {
        checkIsInvitationOK(email, function(truth) {
            if (truth) {
                bcrypt.hash(password, null, null, function(err, hash) {
                    var uStruct = {};
                    uStruct.id = CommonModel.newId();
                    uStruct.pwd = hash;
                    uStruct.email = email;
                    uStruct.handle = handle;
                    uStruct.fullName = fullName;
                    console.log("AdminModel.signup",uStruct);
                    Database.saveAccount(email, uStruct, function(err) {
                        if (!err) {
                            UserModel.newUser(constants.SYSTEM_USER, constants.SYSTEM_USER, uStruct.id, uStruct.handle, function(err) {
                                return callback(err);
                            });
                        } else {
                            return callback(err);
                        }
                    });
                });
            } else {
                return callback(email+" not invited");
            }

        });
        
    };

    /**
     * 
     * @param {*} email 
     * @param {*} password 
     * @param {*} callback err, truth, handle
     */
    self.authenticate = function(email, password, callback) {
        Database.fetchAccount(email, function(err, json) {
            console.log("AdminModel.authenticate",email,json,err);
            if (json) {
                bcrypt.compare(password, json.pwd, function(err1, res) {
                    return callback(err1, res, json.handle, json.id);
                });
            } else {
                return callback("Authentication issue: "+err, false);
            }

        });
    };

    self.checkIsAdmin = function(email, callback) {
        Database.compareAdminEmail(email, function(err, isadmin) {
            return callback(isadmin);
        });
    };
};
if (!instance) {
    instance = new Admin();
}
module.exports = instance;