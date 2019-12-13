var express = require("express");
var session = require("express-session");
var mysqlQ = require("./dbConnect.js");
var bodyparser = require("body-parser");
var router = express.Router()
var cors = require("cors");
var con = mysqlQ();
var app = express();
app.use(session({ secret: 'Secretses Hobbitses' }));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(cors());

router.use(function (req, res, next) {
    console.log("questions main route")
    next()
})
//GET REQUESTS FOR QUESTIONS AND SEARCH


/**
 * the search function takes the vody of text sent by the front end (front end filters special characters)
 * it then splits the array where there are spaces and creates another.
 * it create a basic url and will then add extra statements to the end for each word in the new array.
 * it will then send the full url to the database which will search for any questions that contain certain words.
 * i have inluded a space before each word to prevent searches like 'hr' returning a word that contains this string such as 'tHRee'
 * this is oli's favourite backend API
 */

router.get('/SearchQ/:query', function (req, res) {
    let stringSearch = req.params.query
    let word = stringSearch.split(' ')
    word = word.filter(function (item) {
        return !filterCheck.includes(item);
    })
    let url = `select q.*,Date_format(postdate_Q,'%d/%m/%Y') as niceDate, TIME_FORMAT(postdate_Q, "%H:%i:%s") as niceTime, ((question LIKE '% ${word[0]}%') +`
    for (var i = 1; i <= word.length; i++) {
        if (i < word.length - 1) { url = url + ` (question LIKE '% ${word[i]}%') +` }
        else if (i == word.length) { url = url + ` (question LIKE '% ${word[i - 1]}%'))` }

    }
    url = url + `as hits FROM questions q HAVING hits > 0 ORDER by hits DESC`

    console.log(url)
    con.connect(function (err) {
        con.query(url, function (err, results) {
            console.log(results)
            res.send(results)
        })
    })
})

/**
 * the below three request will just return the questions for the main page, limiting it to 5 per heading.
 * we have used date format and time format so the date and time for posting display in a user friendly manner
 * in the bottom two we have used left join to allow us to interogate more than one table at a time
 * this is used to determine which questions have no correspnding answer in the answer table (using foreign keys)
 */

router.get('/RecentQ', function (req, res) {
    con.connect(function (err) {
        con.query(`select *, Date_format(postdate_Q,'%d/%m/%Y') as niceDate, TIME_FORMAT(postdate_Q, "%H:%i:%s") as niceTime from questions ORDER BY postdate_Q desc LIMIT 5`, function (err, results) {
           if(err){console.log(err)}
           console.log(results)
            res.send(results)
        })

    })
})

//get request for questions with no answers
router.get('/UnansweredQ', function (req, res) {
    con.connect(function (err) {
        con.query(`select q.*, Date_format(postdate_Q,'%d/%m/%Y') as niceDate, TIME_FORMAT(postdate_Q, "%H:%i:%s") as niceTime from questions q LEFT JOIN answers a ON q.q_id = a.q_id where a.q_id IS NULL ORDER by postdate_Q desc LIMIT 5`, function (err, results) {
            if (err) { console.log("inside query" + err) }
            res.send(results)
        })
    })
})

//get request for questions with highest rating and ordered H-L
router.get('/TopRatedQ', function (req, res) {
    con.connect(function (err) {
        con.query(`select *, Date_format(postdate_Q,'%d/%m/%Y') as niceDate, TIME_FORMAT(postdate_Q, "%H:%i:%s") as niceTime from questions q LEFT JOIN questionrating qr ON q.q_id = qr.q_id WHERE qr.q_id IS NOT NULL ORDER by qr.rating desc LIMIT 5`, function (err, results) {
            if (err) { console.log("inside query" + err) }
            res.send(results)
        })
    })
})



//DELETE REQUEST FOR QUESTIONS DELETING FROM RATING TABLE FIRST

/**
 * this query will delete all records relating to a particular questions based on the q_id
 * it first removes the equivalent question rating
 * then it will find all answer id's that relate to a specific questions
 * this allows us to remove all comments with the same a_id, all answer ratings and finally answers
 * we can then delete the question itself. it has to be in this order due to foreign key constraints in mysql.
 *
 */
router.delete('/DelQ/:q_id', function (req, res) {
    let q_id = req.params.q_id
    con.connect(function (err) {
        con.query(`delete from questionrating where q_id = ${q_id}`, function (err, results) {
            if(err){console.log("QR"+err)}

            con.query(`select a_id from answers where q_id = ${q_id}`, function (err, results) {
                if(err){console.log("selectA"+err)}
                var a_id = []
                results.forEach(element => {
                    a_id.push(element.a_id)
                });
                con.query(`delete from comments where a_id in (${a_id})`,function(err,results){

                
                con.query(`delete from answerrating where a_id in (${a_id})`, function (err, results) {
                    if(err){console.log("AR"+err)}
                    con.query(`delete from answers where q_id = ${q_id}`, function (err, results) {

                        if(err){console.log("A"+err)}
                        con.query(`delete from questions where q_id = ${q_id}`, function (err, results) {
                            if(err){console.log("Q"+err)}
                            res.send({ response: "question deleted" })
                        })
                        })
                    })
                })
            })
        })

    })
})


//POST RREQUEST FOR QUESTIONS

/**
 * the below two queries will post to and update questions in the database using bodys of data sent by front end.
 */

router.post('/PostQ', function (req, res) {

    let question = req.body.question
    let userID = req.body.userID
    var returnedID = "";
    con.connect(function (err) {
        con.query(`insert into questions values(0,'${question}',${userID},CURRENT_TIMESTAMP())`, function (err, results) {
            if (err) { console.log(err) }
            res.send(results)
            returnedID = results.insertId
            con.query(`insert into questionrating values(${returnedID},${userID},0)`, function (err, results) {
                if (err) { console.log(err) }
            })
        })
    })

})

//PUT REQUEST FOR QUESTIONS
router.put('/UpdateQ', function (req, res) {
    let updQ = req.body.updQ
    let q_id = req.body.q_id
    con.connect(function (err) {
        con.query(`UPDATE questions SET question = "${updQ}" WHERE q_id = ${q_id}`, function (err, results) {
            res.send(results)
        })
    })
})




/** 
 * this is just an array of words that will be filtered from any search query to prevent unwanted questions being returned.
 */

const filterCheck = ["the", "is", "this", "and", "why", "a", "our", "there", "theirs", "what", "where", "when"]


module.exports = router

