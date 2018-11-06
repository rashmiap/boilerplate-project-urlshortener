'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var parser = require('body-parser');
const dns = require('dns');

var cors = require('cors');

var app = express();

const Schema = mongoose.Schema;
const URLSchema = new Schema({original_url: {type: String, required: true}, short_url: {type: String, required: true}});
let URL = mongoose.model("URL", URLSchema);

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connect(process.env.MONGO_URI);
app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(parser.urlencoded({extended: false}));
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post("/api/shorturl/new", function(req, res, done) {
    var pattern = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
  if(!pattern.test(req.body.url)) {
    res.json({error: "invalid REGEX URL"});
  } else {
    dns.lookup(req.body.url.replace(/(^\w+:|^)\/\//, ''), function(err) {
      if (err) res.json({error: "invalid DNS URL"});
      else {
         URL.find({original_url: req.body.url}, function(err, data) {
       if (data.length < 1) {
      //doesn't exist. make new 
      URL.find({}, function(err, findData) {
      if (err) return done(err);
      let newURL = new URL({original_url: req.body.url, short_url: findData.length});
      newURL.save(function(err) {
       if (err) return done(err); 
        res.json({original_url: newURL.original_url, short_url: newURL.short_url});
      });
      });
   }
   else {
    //does exist, return 
     res.json({original_url: data[0].original_url, short_url: data[0].short_url});
   }
  });
      }
    });   
  }
  
});

app.get("/api/shorturl/:url", function(req,res,done) {
  URL.find({short_url: req.params.url}, function(err, data) {
    if (err) res.json({error: "invalid URL"});
    else {
      if (data.length < 1) res.json({error: "invalid URL"});
      else return res.redirect(data[0].original_url);
    }
  });
});




app.listen(port, function () {
  console.log('Node.js listening ...');
});
