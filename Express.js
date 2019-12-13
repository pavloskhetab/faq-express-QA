var express = require('express')
var questions = require('./QuestionRoute');
var answers = require('./AnswerRoute');
var comments = require('./CommentsRoute');
var cors = require("cors");
var express = require("express");
var bodyparser = require("body-parser");
var cors = require("cors");
var app = express();
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(cors());
// ...
app.use(cors());
app.use('/Questions', questions);
app.use('/Answers',answers);
app.use('/Comments',comments);

app.listen(4001);