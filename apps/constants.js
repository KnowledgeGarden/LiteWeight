/**
 * @author park
 * Constants to tidy up code
 * */
//a user identity for testing
module.exports.TEST_CREATOR                 = "TestUser";
//for internally created nodes
module.exports.SYSTEM_USER                  = "SystemUser";

/**Error Messages */
module.exports.DUPLICATE_ERROR              = "Duplicate";
module.exports.INSUFFICIENT_CREDENTIALS     = "InsufficientCredentials";

/**
 * File Suffix
 * It appears that we will not be using filename suffixes
 */
module.exports.CONVERSATION_SUFFIX          = "_CONV";
module.exports.MAP_SUFFIX                   = "_MAP";
module.exports.QUESTION_SUFFIX              = "_QN";
module.exports.ANSWER_SUFFIX                = "_AN";
module.exports.PRO_SUFFIX                   = "_PROA";
module.exports.CON_SUFFIX                   = "_CONA";
module.exports.NOTE_SUFFIX                  = "_NT";
module.exports.REFERENCE_SUFFIX             = "_REF";
module.exports.DECISION_SUFFIX              = "_DN";
module.exports.RELATION_SUFFIX              = "_RLN";

/** initial channels */
module.exports.BOOKMARK_CHANNEL            = "bookmarks";
module.exports.GENERAL_CHANNEL             = "general";
module.exports.GENERAL_HELP                = "help";
module.exports.PROCON_CHANNEL               = "procon";


/** Node Types */
module.exports.CONVERSATION_NODE_TYPE       = "ConversationNodeType";
module.exports.MAP_NODE_TYPE                = "MapNodeType";
module.exports.QUESTION_NODE_TYPE           = "QuestionNodeType";
module.exports.ANSWER_NODE_TYPE             = "AnswerNodeType";
module.exports.PRO_NODE_TYPE                = "ProArgNodeType";
module.exports.CON_NODE_TYPE                = "ConArgNodeType";
module.exports.NOTE_NODE_TYPE               = "NoteNodeType";
module.exports.REFERENCE_NODE_TYPE          = "ReferenceNodeType";
module.exports.DECISION_NODE_TYPE           = "DecisionNodeType";
module.exports.TAG_NODE_TYPE                = "TagNodeType";
module.exports.PERSONAL_TAG_NODE_TYPE       = "PersonalTagNodeType";

module.exports.RELATION_NODE_TYPE           = "RelationNodeType";
module.exports.BOOKMARK_NODE_TYPE           = "BookmarkNodeType";
module.exports.BLOG_NODE_TYPE               = "BlogNodeType"; // used for the Journal App
module.exports.CHANNEL_NODE_TYPE            = "ChannelNodeType";
module.exports.USER_NODE_TYPE               = "UserNodeType";
module.exports.DM_NODE_TYPE                 = "DMNodeType";
/**
 * Node schema fields
 * While we don't actually use these in Javascript
 * it's worth recording them somewhere
 * The difference being, e.g.
 *   node.id vs node[constants.ID_FIELD]
 */
module.exports.ID_FIELD                     = "id";
//like the subject or label field of a blog post
module.exports.STATEMENT_FIELD              = "statement";
//like the rich-text body field of a blog post
module.exports.DETAILS_FIELD                = "details";
module.exports.CREATOR_ID_FIELD             = "creatorId";
module.exports.CREATED_DATE_FIELD           = "createdDate";
//VERSION_FIELD will support optimistic locking for
// concurrency if this platform is multi-user
module.exports.VERSION_FIELD                = "version";
//root node of a conversation
module.exports.ROOT_NODE                    = "rootNode";
module.exports.ANSWERS_FIELD                = "answers";
module.exports.QUESTIONS_FIELD              = "questions";
module.exports.CON_ARGS_FIELD               = "conargs";
module.exports.PRO_ARGS_FIELD               = "proargs";
module.exports.NOTES_FIELD                  = "notes";
module.exports.REFERENCES_FIELD             = "references";
module.exports.DECISIONS_FIELD              = "decisions";
module.exports.RELATIONS_FIELD              = "relations";
module.exports.BOOKMARKS_FIELD              = "bookmarks";
//CREATED_DATE_FIELD and CREATOR_ID_FIELD
// might become part of a JOURNAL_LIST_FIELD
// in which we track all activity around a given node
module.exports.CREATED_DATE_FIELD           = "createdDate";

/** EventTypes */
module.exports.NEW_NODE_EVENT               = "NewNodeEvent";
module.exports.EDIT_NODE_EVENT              = "EditNodeEvent";
module.exports.ADD_CHILD_EVENT              = "AddChildEvent";
module.exports.ADD_RELATION_EVENT           = "AddRelationEvent";
module.exports.LOGIN_EVENT                  = "LoginEvent";
module.exports.LOGIN_FAIL_EVENT             = "LoginFailEvent";
module.exports.LOGOUT_EVENT                 = "LogoutEvent";
module.exports.SIGNUP_EVENT                 = "SignupEvent";

