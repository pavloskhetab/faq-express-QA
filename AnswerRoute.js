var express = require("express");
var session = require("express-session");
var mysqlQ = require("./dbConnect.js");
var bodyparser = require("body-parser");
var router = express.Router();
var cors = require("cors");
var con = mysqlQ();
var app = express();


router.use(function (req, res, next) {
    console.log("answers main route")
    next()
})



//GET REQUEST FOR NUMBER OF ANSWERS A QUESTION HAS

/** 
 * this method counts the number of answers relating to a specific q_id - is is sent back as hits as javascript does not like count(a_id) believeing it to be a function rather than data
 */
router.get('/CountA/:q_id', function (req, res) {
    let q_id = req.params.q_id
    con.connect(function (err) {
        con.query(`select count(a_id) as hits from answers where q_id = ${q_id}`, function (err, results) {
            res.send(results)
        })
    })
})

//GET REQUEST FOR ANSWERS IN ORDER OF HIGHEST RATING
/**
 * sends answers to front end and orders them by highest rating in answer table - uses left join to determine corresponding values in tables.
 */
router.get('/RecentA/:q_id', function (req, res) {
    let q_id = req.params.q_id
    con.connect(function (err) {
        con.query(`select *,Date_format(postdate_A,'%d/%m/%Y') as niceDate, TIME_FORMAT(postdate_A, "%H:%i:%s") as niceTime from answers a LEFT JOIN answerrating ar ON a.a_id = ar.a_id WHERE a.q_id = ${q_id} ORDER by ar.rating desc`, function (err, results) {
            res.send(results)
        })
    })
})



//DELETE REQUESTS FOR ANSWERS, DELETING FROM RATING TABLE FIRST
/**
 * similar to deleting a question it will delete from tables that include foreign keys first to prevent erros and then remove the answer.
 */
router.delete('/DelA/:a_id', function (req, res) {
    let a_id = req.params.a_id
    con.connect(function (err) {
        con.query(`delete from comments where a_id = ${a_id}`, function (err, results) {
        })
        con.query(`delete from answerrating where a_id = ${a_id}`, function (err, results) {
        })
        con.query(`delete from answers where a_id = ${a_id}`, function (err, results) {
            res.send({ response: "answer deleted" })
        })
    })
})

//PUT REQUEST FOR ANSWERS
router.put('/UpdateA', function (req, res) {
    let updA = req.body.updA
    let a_id = req.body.a_id
    console.log(updA + " " + a_id )
    console.log(updA +" " + a_id)
    con.connect(function (err) {
        con.query(`Update answers SET answer = "${updA}" WHERE a_id = ${a_id}`, function (err, results) {
            res.send(results)
        })
    })
})

//POST REQUEST FOR ANSWERS
/**
 * this will post a new answer and will create a correpsonding answer rating of 0 entry in the other table.
 * this is to ensure each answer has a rating regardless of its value to prevent errors when mapping answers on front end.
 */
router.post('/PostA', function (req, res) {
    let answer = req.body.answer
    let q_id = req.body.q_id
    let u_id = req.body.u_id
    var returnedID = ""
    con.connect(function (err) {
        con.query(`insert into answers values(0,'${answer}','${u_id}','${q_id}',CURRENT_TIMESTAMP())`, function (err, results) {
            if (err) { console.log(err) }
            res.send(results)
            returnedID = results.insertId
            console.log(returnedID)
            con.query(`insert into answerrating values(${returnedID},${u_id},0)`, function (err, results) {
                if (err) { console.log }
            })
        })

    })
})

module.exports = router