'use strict';

var express = require('express');
var router = express.Router();

var albumController = require('../controllers/album.controller');
var authController = require('../controllers/auth.controller');
var galleryController = require('../controllers/gallery.controller');
var postController = require('../controllers/post.controller');
var userController = require('../controllers/user.controller');

var User = require('../models/user');

/**
 * Routers
 */
router.post('/user/signin', isAdmin, authController.signIn);
router.get('/user/current', isLoggedIn, authController.currentUser);

router.post('/album', isLoggedIn, albumController.retrieveByAdmin);
router.post('/album/delete/:id', isLoggedIn, albumController.deleteById);

router.get('/gallery', isLoggedIn, galleryController.retrieveByAdmin);
router.post('/gallery', isLoggedIn, galleryController.create);
router.get('/gallery/album/:albumId', isLoggedIn, galleryController.retrieveByAlbum);
router.post('/gallery/album/:albumId', isLoggedIn, galleryController.updateByAlbum);
//router.post('/user/delete/:id', isLoggedIn, userController.delete);

router.get('/user', isLoggedIn, userController.retrieveByAdmin);
router.post('/user/delete/:id', isLoggedIn, userController.delete);

router.get('/home/users', isLoggedIn, userController.getCount);
router.get('/home/albums', isLoggedIn, albumController.getCount);
router.get('/home/galleries', isLoggedIn, galleryController.getCount);
//router.get('/home/comments', isLoggedIn, commentController.getCount);

/**
 * Post for Blog
 */
router.get('/post', isLoggedIn, postController.retrieve);
router.post('/post', isLoggedIn, postController.create);
router.put('/post', isLoggedIn, postController.update);
router.delete('/post/:id', isLoggedIn, postController.delete);

module.exports = router;

/**
 *
 * If User role is Admin
 * @param req
 * @param res
 * @param next
 */
function isAdmin(req, res, next) {
    var callback = function (err, user) {
        if (err) {
            return next(err);
        }
        if (user && user.roles.join(',').indexOf('admin') > -1) {
            return next();
        }
        res.status(401).json({message: 'User is not Admin!'});
    };

    User.findOne({username: req.body.username}, callback);
}

/**
 * Route middleware to ensure user is logged in
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
function isLoggedIn(req, res, next) {
    var user = req.decoded && req.decoded.user;
    if (user && user.roles.indexOf('admin') > -1) {
        return next();
    }
    res.status(401).json({message: "Auth failed"});
}
