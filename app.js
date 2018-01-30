/* @author park */
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var uuid = require('uuid');
var flash = require("connect-flash");
var session = require("express-session");

//environment
var environment = new require('./apps/environment')();

var app = express();
var hbs = require('hbs');

var viewPath = path.join(process.cwd(), "views");
app.set("view engine", "hbs");
app.set("views", viewPath); //path.join(__dirname, "/views"));
hbs.registerPartials(__dirname + '/views/partials');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

//app.use(cookieParser()); // collides with session
app.use(express.static(path.join(__dirname, "public")));
app.use(flash());

app.use(session({
  genid: function(req) {
    return uuid.v4(); // use UUIDs for session IDs
  },
  secret: "collaborative sauce", //TODO ChangeMe
  resave: true,
  saveUninitialized: true
}));

//routes
var Indx = require('./routes/index');
var Conv = require('./routes/conversation');
var users = require('./routes/users');
var Tags = require('./routes/tags');
var Bmk = require('./routes/bookmark')
var Reln = require('./routes/connections');
var DbP = require('./routes/dbpedia');
var Cs = require('./routes/carrotsearch');
var Gm = require('./routes/geomap');
var Jnl = require('./routes/journal');
var Ed = require('./routes/edit');
var Chn = require('./routes/channels');
var Srch = require('./routes/search');
var PTags = require('./routes/personaltags');
var Inbox = require('./routes/inbox');
var ProCon = require('./routes/procon');

app.use('/users', users);
app.use('/bookmark/', Bmk);
app.use('/tags', Tags);
app.use("/connections", Reln);
app.use('/conversation', Conv);
app.use('/channels', Chn);
app.use('/dbpedia', DbP);
app.use('/carrotsearch', Cs);
app.use('/geomap', Gm);
app.use('/journal', Jnl);
app.use('/edit', Ed);
app.use('/search', Srch);
app.use('/carrotsearch', Cs);
app.use('/dbpedia', DbP);
app.use('/personaltags', PTags)
app.use('/inbox', Inbox);
app.use('/procon/', ProCon);

// Index has to be last
app.use('/', Indx);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
