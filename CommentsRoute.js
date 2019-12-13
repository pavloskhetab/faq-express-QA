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
    console.log("Comments main route")
    next()
})

/**
 * the below two queries just post new comments and update existing comments on request.
 */
//POST REQUEST FOR COMMENTS
router.post('/PostC',function(req,res){
    let comment = req.body.comment
    let userID = req.body.userID
    let a_id = req.body.a_id
    console.log(comment)
    con.connect(function(err){
        con.query(`insert into comments values(0,'${comment}',${userID},${a_id},CURRENT_TIMESTAMP())`,function(err, results){
            res.send(results)
        })
    })
})
//PUT REQUEST FOR COMMENTS
router.put('/UpdateC',function(req,res){
    let updC = req.body.updC
    let c_id = req.body.c_id
    con.connect(function(err){
        con.query(`update comments set comment = '${updC}' where c_id = ${c_id}`,function(err,results){
            if(err){console.log(err)}
            res.send({"Update":"completed"})
        })
    })
})

//GET REQUEST FOR COMMENTS

/**
 * this will send all comments relating to a specific answer id to the front end - it recieves a q_id
 * it then searches the answer table for all answers with the q_id and pushes the a_id into a new array
 * the new array is then used to grab all comments for all answers in the array.
 */
router.get('/GetC/:q_id',function(req,res){
    let q_id = req.params.q_id
    con.connect(function(err){
        con.query(`select a_id from answers where q_id = ${q_id}`,function(err,results){
          var a_id = []
          results.forEach(element => {
              a_id.push(element.a_id)
          });
          console.log(a_id)
            con.query(`select *, Date_format(postdate_C,'%d/%m/%Y') as niceDate, TIME_FORMAT(postdate_C, "%H:%i:%s") as niceTime from comments where a_id in (${a_id})`,function(err,results){
                if(err){console.log(err)}
                res.send(results)
            }) 
        })
    })
})

/**
 * this delated a comment by checking the c_id
 */

//DELETE REQUEST FOR COMMENTS
router.delete('/DelC/:c_id',function(req,res){
    let c_id = req.params.c_id
    con.connect(function(err){
        con.query(`delete from comments where c_id = ${c_id}`,function(err, results){
            res.send(results)
        })
    })
})

module.exports = router