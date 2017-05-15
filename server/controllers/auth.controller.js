'use strict';

//------------------------------------------------------------------------------
//
// Private Variables
//
//------------------------------------------------------------------------------

var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var crypto = require('crypto');
var jwt = require('jsonwebtoken');
var passport = require('passport');
var configs = require('../config/config')[env];

var User = require('../models/user');
var emailController = require('./mail.controller');

/**
 *
 * @param user
 */
function signToken(user) {
    return jwt.sign({user: user}, configs.secrets.session, {expiresIn: 60 * 60 * 3});
}

//------------------------------------------------------------------------------
//
// Public Functions
//
//------------------------------------------------------------------------------

/**
 *
 * @param req
 * @param res
 */
function currentUser(req, res, next) {
    var user = req.decoded.user;

    if (!user) {
        return next(new Error("Auth failed!"));
    }
    res.json(user);
}

/**
 *
 * @param req
 * @param res
 * @param next
 */
function signIn(req, res, next) {
    passport.authenticate('local-login', function (err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            //TODO: PhotoHost: Use localiz on UI
            return next(new Error("Неверное имя пользователя или пароль!"));
        } else {
            var token = signToken(user);
            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }
                if (!token) {
                    return next(new Error("Can't create token!"));
                }

                //TODO: PhotoHost: Use localiz on UI
                if (!user.verified) {

                    //TODO: PhotoHost: Change Server URL
                    //TODO: PhotoHost: Create beautiful HTML
                    var baseUrl = req.protocol + '://i.fpicture.ru',
                        message = "Ваш аккаунт еще не подтвержден!\n Письмо с кодом активации отправлено повторно.",
                        subject = 'Email verification',
                        activationLink = '<a href="' + baseUrl + '/api/user/verify/' + user.activationCode + '">Activation Link</a>';

                    var mailOptions = {
                        html: activationLink,
                        message: message,
                        subject: subject,
                        to: user.email
                    };

                    emailController.send(mailOptions, res, next);
                } else {
                    //TODO: PhotoHost: Use localiz on UI
                    if (!user.isActive) {
                        return next(new Error("Your account is deactivated!"));
                    }
                    req.user = user;
                    res.json({user: user, token: token});
                }
            });
        }
    })(req, res, next);
}

/**
 *
 * @param req
 * @param res
 * @param next
 */
function signUp(req, res, next) {
    //TODO: PhotoHost: Refactor, doesn't check duplicate email and username
    var newUser = req.body,
        activationCode;

    activationCode = crypto.createHmac('sha1', newUser.email).update(newUser.password).digest('hex');
    newUser.activationCode = activationCode;
    newUser.username = req.body.username;

    var callback = function (err, user) {
        if (err) {
            if (err.code === 11000) {
                return next(new Error("Пользователь с именем " + req.body.username + " и/или c E-mail:" + req.body.email + " сушествует!"));
            } else {
                return next(err);
            }
        } else {

            //TODO: PhotoHost: Change Server URL
            //TODO: PhotoHost: Create beautiful HTML
            var baseUrl = req.protocol + '://i.fpicture.ru',
                message = "Письмо с кодом активации отправлено.",
                subject = 'Email verification',
                activationLink = '<a href="' + baseUrl + '/api/user/verify/' + user.activationCode + '">Activation Link</a>';

            var mailOptions = {
                html: activationLink,
                message: message,
                subject: subject,
                to: user.email
            };

            emailController.send(mailOptions, res, next);
        }
    };

    User.create(newUser, callback);
}

/**
 *
 * @param req
 * @param res
 */
function signOut(req, res) {
    req.logout();
    res.json({status: 'ok'});
}

/**
 *
 * @param req
 * @param res
 * @param next
 */
function verify(req, res, next) {
    var callback = function (err) {

        //TODO: PhotoHost: Change Server URL
        var baseUrl = req.protocol + '://fpicture.ru/signin',
            message = 'Your email has been activated. Please log in.';

        if (err) {
            //TODO: PhotoHost: Or some another Error Message
            message = 'Error during verify.';
        }

        //TODO: PhotoHost: to send message
        req.flash('activation', message);
        res.redirect(baseUrl);
    };

    User.findOneAndUpdate({activationCode: req.params.activationCode}, {$set: {verified: true}}, callback);
}

/**
 *
 * @param req
 * @param res
 * @param next
 */
function forgot(req, res, next) {
    var email = req.body.email;

    if (!email) {
        return next(new Error("Please enter Email!"));
    }

    var callback = function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return next(new Error("Can't find User with this Email!"));
        }

        //TODO: PhotoHost: Create beautiful HTML
        var message = "Message send.",
            subject = "Email password",
            html = "Your Password: " + user.dummyPassword;

        var mailOptions = {
            html: html,
            message: message,
            subject: subject,
            to: user.email
        };

        emailController.send(mailOptions, res, next);
    };

    User.findOne({email: email}, callback);
}

module.exports = {
    currentUser: currentUser,
    signIn: signIn,
    signUp: signUp,
    signOut: signOut,
    verify: verify,
    forgot: forgot
};