var jsonwebtoken = require("jsonwebtoken");
var md5 = require('md5');
var SECRET_KEY = 'secret_key';
const mysql = require('mysql'); // or use import if you use TS
const util = require('util');
const conn = mysql.createConnection({
host: 'localhost',
user: 'root',
password: 'root',
database: 'user'
});

let db = {};

// node native promisify
const query = util.promisify(conn.query).bind(conn);

// INSERTING USER
exports.insert = async (req, res, next) => {
  
  if (!req.body.email || !req.body.psw || !req.body.fname || !req.body.lname || !req.body.phone) {
    return res.status(400).json({
      message: "Please fill in all the required fields.",
      fields: ["email", "psw","fname","lname","phone"],
    });
  }

  try {
      
    let rows = await query(
      "INSERT INTO `users`(`user_email`,`user_pass`,`user_fname`,`user_lname`,`user_phone`) VALUES( ?, MD5(?), ?, ?, ?)",
      [req.body.email, req.body.psw, req.body.fname, req.body.lname,req.body.phone]
    );
      
    let rowsmeta = await query(
      "INSERT INTO `users_meta`(`user_id`,`active`,`user_role`) VALUES( ?, ? , ?)",
      [rows.insertId,'inactive','subscriber']
    );
    
    if (rows.affectedRows === 1 && rowsmeta.affectedRows===1) {
      return res.status(200).json({
        status: 200,
        message: "The user has been successfully inserted.",
        userID: rows.insertId,
      });
    }

  } catch (err) {
    next(err);
  }
  
};

// FETCHING ALL USERS
exports.getAllUsers = async (req, res, next) => {
  try {
    //let rows = await query("SELECT * FROM `users`");
let rows = await query("SELECT u.user_email,u.user_fname,u.user_lname,u.user_phone,um.user_role,um.active FROM users AS u LEFT JOIN users_meta AS um ON u.id = um.user_id");

    if (rows.length === 0) {
      return res.status(200).json({
        message:
          "There are no users in the database, please insert some users.",
      });
    }

    res.status(200).json(rows);
    

  } catch (err) {
    next(err);
  }

};


// FETCHING SINGLE USER
exports.getUserByID = async (req, res, next) => {

  try {

    let row = await query(
        "SELECT * FROM `users` WHERE `id`=?",
        [req.params.id]
    );

    if (row.length === 0) {
      return res.status(404).json({
        message: "No User Found!",
      });
    }

    res.status(200).json(row[0]);

  } catch (err) {
    next(err);
  }

};

// UPDATING USER
exports.updateUser = async (req, res, next) => {
  try {

    let row = await query(
        "SELECT * FROM `users` WHERE `id`=?",
        [req.body.id]
    );

    let metarow = await db_connection.execute(
        "SELECT * FROM `users_meta` WHERE `user_id`=?",
        [req.body.id]
    );

    if (row.length === 0 && metarow.length===0) {
      return res.status(404).json({
        message: "Invalid User ID",
      });
    }

    

    let update = await query(
      "UPDATE `users` SET `user_fname`=? `user_lname`=? `user_phone`=? WHERE `id`=?",
      [req.body.user_fname, req.body.user_lname, req.body.user_phone, req.body.id]
    );

    let metaupdate = await query(
        "UPDATE `users_meta` SET `active`=?, `user_role`=? WHERE `user_id`=?",
        [req.body.active , req.body.user_role , req.body.id]
      );
 
    if (update.affectedRows === 1 && metaupdate.affectedRows===1) {
      return res.json({
        message: "The User has been successfully updated.",
      });
    }

  } catch (err) {
    next(err);
  }

};

// DELETING USER
exports.deleteUser = async (req, res, next) => {

  try {

    const [row] = await query(
        "DELETE FROM `users` WHERE `id`=?",
        [req.params.id]
    );

    if (row.affectedRows === 0) {
      return res.status(404).json({
        message: "Invalid user ID (No User Found!)",
      });
    }

    res.status(200).json({
      message: "The user has been deleted successfully.",
    });
    
  } catch (err) {
    next(err);
  }

};

// Login USER API
exports.postLogin = async (req, res, next) => {

  try {
    
    db.getUserByEmail = (email) =>{
      return new Promise((resolve, reject)=>{
        conn.query('SELECT * FROM users WHERE user_email = ?', [email], (error, users)=>{
              if(error){
                  return reject(error);
              }
              return resolve(users[0]);
          });
      });
  };
   
   const email = req.body.email;
   const password = md5(req.body.password);
    user = await db.getUserByEmail(email);
    
    if(!user){
      return res.json({
          message: "Invalid email or password"
      })
  }
   
    const isValidPassword = password.match(user.user_pass);
    
    if(isValidPassword){
        user.password = undefined;
        const jsontoken = jsonwebtoken.sign({user: user}, SECRET_KEY, { expiresIn: '15d'} );
        res.cookie('token', jsontoken, { httpOnly: true, secure: true, SameSite: 'strict' , expires: new Date(Number(new Date()) + 30*60*1000) }); //we add secure: true, when using https.
 
        res.json({
          ok: true,
          message: "Login successful",
          token: jsontoken
        });
 
    }  else{
        return res.json({
            ok: false,
            message: "Username or password incorrect"
        });
    }
      

     

  } catch (err) {
    next(err);
  }

};

// Reset Password API
exports.resetpassword = async (req, res, next) => {

  try {
    
    let row = await query(
      "SELECT id,user_email FROM `users` WHERE `user_email`=?",
      [req.body.user_email]
  );
   
   const user_password = req.body.user_pass;
   const user_id = row[0].id;
   
    
       
   
   
  const update = await query(
      "UPDATE `users` SET `user_pass`=MD5(?) WHERE `id`=?",
      [user_password, user_id]
    );

    
    if(update){
        const jsontoken = jsonwebtoken.sign({update: update}, SECRET_KEY, { expiresIn: '15d'} );
        res.cookie('token', jsontoken, { httpOnly: true, secure: true, SameSite: 'strict' , expires: new Date(Number(new Date()) + 30*60*1000) }); //we add secure: true, when using https.
 
        res.json({
          ok: true,
          message: "User Password Updated Successfully",
          token: jsontoken
        });
 
    }  else{
        return res.json({
            ok: false,
            message: "User Password Not Updated"
        });
    }
      

     

  } catch (err) {
    next(err);
  }

};

// Get User By Phone
exports.getuserbyphone = async (req, res, next) => {

  try {
    
    let row = await query(
      "SELECT user_email,user_fname,user_lname FROM `users` WHERE `user_phone`=?",
      [req.query.user_phone]
  );
    
    
    if(row!=''){
        const jsontoken = jsonwebtoken.sign({row: row}, SECRET_KEY, { expiresIn: '15d'} );
        res.cookie('token', jsontoken, { httpOnly: true, secure: true, SameSite: 'strict' , expires: new Date(Number(new Date()) + 30*60*1000) }); //we add secure: true, when using https.
 
        res.json({
          ok: true,
          row:row,
          token: jsontoken
        });
 
    }  else{
        return res.json({
            ok: false,
            row:'',
            message:'Phone number does not exist'
        });
    }
      

     

  } catch (err) {
    next(err);
  }

};  