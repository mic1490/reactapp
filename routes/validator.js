const db_connection = require('../db');
const { body, param, validationResult } = require("express-validator");
const mysql = require('mysql'); // or use import if you use TS
const util = require('util');
const conn = mysql.createConnection({
host: 'localhost',
user: 'root',
password: 'root',
database: 'user'
});

const query = util.promisify(conn.query).bind(conn);

module.exports = {
    // User name and email Validation
    userInfo: [  
      body("email", "Invalid email address")
        .optional()
        .trim()
        .unescape()
        .escape()
        .isEmail()
        .custom(async (value) => {
          // Checking that the email already in use or NOT
          const row = await query(
            "SELECT `user_email` FROM `users` WHERE `user_email`=?",
            [value]
          );
          if (row.length > 0) {
            return Promise.reject("E-mail already in use");
          }
        }),
    ],
  
    // User ID Validation
    userID: [param("id", "Invalid User ID").trim().isInt()],
  
    // Checking Validation Result
    result: (req, res, next) => {
      const errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }
      next();
    },
  };