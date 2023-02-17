var express = require('express');
var router = express.Router();
var db = require('../db');

router.get('/', function (req, res, next) {

  var sqlQuery = `SELECT * FROM users u ,users_meta um WHERE u.id = um.user_id`;

  db.query(sqlQuery, function (err, results, fields) {
      res.render('index', {
        title: 'Login',
        authorised: req.session.authorised,
        fname: req.session.fname,
        lname:req.session.lname,
        phone:req.session.phone,
        role:req.session.role,
        users: results
      }); 

  });

});

module.exports = router;