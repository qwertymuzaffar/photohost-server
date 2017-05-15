'use strict';

//------------------------------------------------------------------------------
//
// Private Variables
//
//------------------------------------------------------------------------------

var Feedback = require('../models/feedback');
var emailController = require('./mail.controller');

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
function create(req, res, next) {
    var callback = function (err) {
        if (err) {
            return next(err)
        } else {
            var data = req.body,
                mailOptions;

            mailOptions = {
                from: data.email,
                message: 'Ваше сообщение отправлено.',
                to: 'muzafarkosimov@gmail.com',
                subject: 'New FeedBack From ' + data.name,
                html: data.message
            };

            emailController.send(mailOptions, res, next);
        }
    };

    Feedback.create(req.body, callback);
}

module.exports = {
    create: create
};