// Dependencies
var express = require('express');
var router = express.Router();
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');

// Link to Models
var Article = require("../models/article.js");
var Comment = require('../models/comment.js');



//index
router.get('/', function (req, res) {
    res.redirect('/articles/new');
});


// Scrape data from one site and place it into the mongodb db
router.get("/scrape", function (req, res) {
    
    var result = {};

    var checkArray = [];
    
    request("http://www.asiaone.com/latest", function(error, response, html) {


        var $ = cheerio.load(html);


        // Scrape from asianone.com

        $("div.card.inline--children.col-xs-12").each(function(i, element) {

            var link = "http://asiaone.com/" + $(element).children().attr("href");
            var title = $(element).find($("div.content")).find($("a.header.small")).text();
            var date = $(element).find($("div.content")).find($("span.date-display-single")).text();


            // Send data to result array
            result[i] = ({
                title: title,
                link: link,
                date: date
            });

            // Check for duplicate
            if (checkArray.indexOf(result[i].title) === -1) {

                checkArray.push(result[i].title);

                Article.count({ title: result[i].title }, function (err, test) {
                    if (test === 0) {
                        var newArticle = new Article(result[i]);

                        newArticle.save(function (err, res) {
                            if (err) {
                                throw err;
                            }
                            // else {
                            //     console.log(res);
                            // }
                        });
                    }
                })
            }
        });

        console.log(result);

        res.redirect("/articles/new");
    });
});




// deletes all articles
router.get('/delete', function (req, res) {
    Article.remove({}, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log('removed all articles');
        }

    });
    Comment.remove({}, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log('removed all comments');
        }

    });
    res.redirect('/json-article');
});





// Send articles through INDEX Oldest to Newest
router.get('/articles/old', function (req, res) {
    Article.find().sort({ _id: -1 })
        //send to handlebars
        .exec(function (err, content) {
            if (err) {
                console.log(err);
            } else {
                var sentArticle = { article: content };
                res.render('index', sentArticle);
            }
        });
});




// Send articles through INDEX Newest to Oldest
router.get('/articles/new', function (req, res) {
    Article.find().sort({ _id: 1 })
        //send to handlebars
        .exec(function (err, content) {
            if (err) {
                console.log(err);
            } else {
                var sentArticle = { article: content };
                res.render('index', sentArticle);
            }
        });
});




// This will get the articles we scraped from the mongoDB in JSON
router.get('/json-article', function (req, res) {
    Article.find({}, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            res.json(doc);
        }
    });
});

router.get('/json-comment', function (req, res) {
    Comment.find({}, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            res.json(doc);
        }
    });
});



// Reading / commenting an article
router.get('/read/:id', function (req, res) {

    var articleID = req.params.id;


    var articlePrev = {
        article: [],
        summary: ""
    };

    Article.findOne({ _id: articleID })
        .populate('comment')
        .exec(function (err, results) {
            if (err) { throw err }
            else {
                articlePrev.article = results;
                var link = results.link;

                request(link, function (error, response, html) {

                    var $ = cheerio.load(html);

                    $("section.l-wrapper").each(function (i, element) {
                        articlePrev.summary = $(element).find("h2.c-entry-summary").text();

                        res.render('article', {articlePrev});

                        return false;

                    });
                });
            }
        });

});



// Create a new comment
router.post('/comment/:id', function(req, res) {
    var user = req.body.name;
    var content = req.body.comment;
    var articleId = req.params.id;
  
    var commentObj = {
      name: user,
      comment: content,
      linkedArticle: articleId
    };

    var newComment = new Comment(commentObj);
  
    newComment.save(function(err, result) {
        if (err) {
            console.log(err);
        } else {
            console.log(result);
            Article.findOneAndUpdate({ "_id": req.params.id }, {$push: {'comment':result._id}}, {new: true})
              // redirect
              .exec(function(err, response) {
                  if (err) {
                      console.log(err);
                  } else {
                      res.redirect('/read/' + articleId);
                  }
              });
        }
    });
  });
  


  // Delete comment for article
router.get('/deletecomment/:id', function(req, res){

    var link = "";

    Comment.findOne({"_id": req.params.id})
        .exec(function(err, response) {
            if (err) {
                throw err;
            } else {
                link = response.linkedArticle;
                Comment.remove({'_id': req.params.id}).exec(function(err, data){
                    if(err){
                      console.log(err);
                    } else {
                      console.log("Comment deleted");
                    }
                    res.redirect('/read/' + link);
                  })
            }
    });
    console.log(link);


});


module.exports = router;