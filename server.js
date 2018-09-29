// dependencies
var bodyParser = require('body-parser');
var mongoose   = require('mongoose');
var express    = require('express');

//  initialize Express app
var app = express();

app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static(process.cwd() + '/public'));

var exphbs = require('express-handlebars');
app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/news-scraper";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);


var routes = require('./routes/routes.js');
app.use('/', routes);

var port = process.env.PORT || 8080;
app.listen(port, function(){
  console.log('Listening on PORT ' + port);
});
