const router = require('express').Router();
const validators = require('./validator');
const userController = require('../controllers/userController');

// Inserting User
router.post(
    '/insert-user',
    validators.userInfo,
    validators.result,
    userController.insert
    );

// Fetching all users
router.get(
    '/get-all-users',
    userController.getAllUsers
    );

// Fetching Single User By ID
router.get(
    '/get-user/:id',
    validators.userID,
    validators.result,
    userController.getUserByID
    );

// Updating User
router.patch(
    '/update-user/:id',
    [...validators.userID, ...validators.userInfo],
    validators.result,
    userController.updateUser
    );
    
// Deleting User
router.delete(
    '/delete-user/:id',
    validators.userID,
    validators.result,
    userController.deleteUser
    );

// Login API
router.post(
    '/loginapi',
    userController.postLogin
    );
    
// Reset Password
router.post(
    '/resetpassword',
    userController.resetpassword
);

// Get Single User by Phone Number
router.get(
    '/getuserbyphone',
    userController.getuserbyphone
);


module.exports = router;
