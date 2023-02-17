var express = require('express');
var router = express.Router();
var db = require('../db');
var helpers = require('../helpers');
var errors = [];

router.get('/register', helpers.loginChecker, function (req, res, next) {

  res.render('register', {
    title: 'Register'
  });

});

router.post('/register', helpers.loginChecker, function (req, res, next) {

  if (!helpers.checkForm([req.body.email, req.body.psw, req.body.pswrepeat, req.body.fname, req.body.lname,req.body.phone])) {
    errors.push('Please fill in all fields!');
    next();
    return;
  }

  if (!helpers.validateEmail(req.body.email)) {
    errors.push('Please enter a valid email address!');
    next();
    return;
  }

  if (req.body.psw !== req.body.pswrepeat) {
    errors.push('Passwords are not equal!');
    next();
    return;
  }

  var sqlQuery = `INSERT INTO users VALUES(NULL, ?, MD5(?), ?, ?, ?)`;
  var values = [req.body.email, req.body.psw, req.body.fname,req.body.lname,req.body.phone];

  db.query(sqlQuery, values, function (err, results, fields) {
    var last_id = results.insertId;
    if (err) {
      errors.push(err.message);
      next();
      return;
    }

    var metaQuery = `INSERT INTO users_meta VALUES(NULL,?, ?, ?)`;
    var metavalues = [last_id,'inactive',req.body.role];

    db.query(metaQuery, metavalues, function (metaerr, metaresult, metafields) {
      if (metaerr) {
        errors.push(metaerr.message);
        next();
        return;
      }
      

    if (results.affectedRows == 1 && metaresult.affectedRows==1) {
      res.redirect('/login');
      return;
    } else {
      errors.push(err.message);
      errors.push(metaerr.message);
      next();
    }

  }); 

  });

});

router.post('/register', function (req, res, next) {

  res.statusCode = 401;

  res.render('register', {
    title: 'Register',
    messages: errors
  });

  errors = [];

});

router.get('/login', helpers.loginChecker, function (req, res, next) {

  res.render('login', {
    title: 'Login'
  });

});

router.post('/login', function (req, res, next) {

  if (!helpers.checkForm([req.body.email, req.body.psw])) {
    errors.push('Please fill in all fields!');
    next();
    return;
  }

  if (!helpers.validateEmail(req.body.email)) {
    errors.push('Please enter a valid email address!');
    next();
    return;
  }

  var sqlQuery = `SELECT * FROM users WHERE user_email = ? AND user_pass = MD5(?)`;
  var values = [req.body.email, req.body.psw];

  db.query(sqlQuery, values, function (err, results, fields) {

    if (err) {
      errors.push(err.message);
      next();
      return;
    }

    if (results.length == 1) {
      req.session.authorised = true;
      req.session.fname = results[0].user_fname;
      req.session.lname = results[0].user_lname;
      req.session.phone = results[0].user_phone;
      req.session.role  = results[0].user_role;
      res.redirect('/');
      return;
    } else {
      errors.push('The username or password is incorrect.');
      next();
    }

  });

});

router.post('/login', function (req, res, next) {

  res.statusCode = 401;

  res.render('login', {
    title: 'Login',
    messages: errors
  });

  errors = [];

});

router.get('/exit', function (req, res, next) {

  req.session.destroy(function (err) {
    res.redirect('/');
  });

});

// Edit User Route

router.get('/edit/:id', function(req, res, next) {
  var UserId= req.params.id;
  //var sql=`SELECT * FROM users WHERE id=${UserId}`;
  var sql = `SELECT
  u.id AS u_id,
  u.user_fname AS u_fname,
  u.user_lname AS u_lname,
  u.user_phone AS u_phone,
  um.user_role AS u_role,
  um.active AS u_status
FROM
  users AS u
LEFT JOIN users_meta AS um
ON
  u.id = um.user_id
WHERE
  u.id = ${UserId}`;
  db.query(sql, function (err, data) {
    if (err) throw err;
   
    res.render('update', { title: 'User List', results: data[0]});
  });
});

// Update User Route

router.post('/edit/:id', function(req, res, next) {
  var UserId= req.params.id;
  //var sql=`SELECT * FROM users WHERE id=${UserId}`;
  var sql = "UPDATE `users` SET `user_fname`=? ,`user_lname`=? ,`user_phone`=? WHERE `id`=?";
  db.query(sql,[req.body.fname, req.body.lname, req.body.phone, UserId], function (err, data) {
   if (err) throw err;
   console.log(data.affectedRows + " record(s) updated");
  });
  var sql1 = "UPDATE `users_meta` SET `user_role`=?,`active`=? WHERE `id`=?";
  db.query(sql1,[req.body.role,req.body.status,UserId], function (err1, data1) {
   if (err1) throw err1;
   console.log(data1.affectedRows + " record(s) updated");
  });
  res.redirect('/');
});

// Delete User Route
router.get('/delete/:id', function(req, res, next) {
  var id= req.params.id;
    var sql = 'DELETE u,um FROM `users` u, `users_meta` um WHERE u.id = ?  AND u.id = um.user_id';
    db.query(sql, [id], function (err, data) {
    if (err) throw err;
    console.log(data.affectedRows + " record(s) updated");
  });
  res.redirect('/');
  
});

module.exports = router;