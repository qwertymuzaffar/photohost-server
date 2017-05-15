'use strict';

var express = require('express');
var router = express.Router();

var albumController     = require('../controllers/album.controller');
var authController      = require('../controllers/auth.controller');
var feedbackController  = require('../controllers/feedback.controller');
var galleryController   = require('../controllers/gallery.controller');
var postController      = require('../controllers/post.controller');
var topicController     = require('../controllers/topic.controller');

/**
 * Routers
 */
router.post('/user/signin', authController.signIn);
router.post('/user/signup', authController.signUp);
router.get('/user/signout', authController.signOut);
router.get('/user/verify/:activationCode', authController.verify);
router.post('/user/forgot', authController.forgot);
router.get('/user/current', isLoggedIn, authController.currentUser);

router.post('/gallery', galleryController.create);
router.get('/gallery/:imageId', galleryController.retrieveById);
router.post('/gallery/:imageId', galleryController.updateViews);
router.get('/gallery/album/:albumId', galleryController.retrieveByAlbum);
router.post('/gallery/album/:albumId', isLoggedIn, galleryController.updateByAlbum);
router.post('/gallery/:path', isLoggedIn, galleryController.delete);

router.get('/album/user', isLoggedIn, albumController.retrieveByUser);
router.post('/album/delete/:id', isLoggedIn, albumController.deleteById);
router.get('/album/:albumId', albumController.retrieveById);
router.post('/album/:albumId', albumController.updateViews);
router.get('/album/topic/:topic', albumController.retrieveByTopic);

router.post('/feedback', feedbackController.create);

router.get('/topic', topicController.retrieve);

/**
 * Post for Blog
 */
router.get('/post', postController.retrieve);
router.get('/post/:id', postController.retrieveById);

module.exports = router;

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.decoded) {
        return next();
    }
    res.status(401).json({message: "Auth failed"});
}