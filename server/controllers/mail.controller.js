'use strict';

//------------------------------------------------------------------------------
//
// Private Variables
//
//------------------------------------------------------------------------------

var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');

/**
 * Send
 * @param options
 * @param res
 */
module.exports.send = function (options, res, next) {
    options = options || {};
    options.from = options.from || "support@fpicture.ru";
    options.to = options.to || '';
    options.subject = options.subject || '';
    options.html = options.html || '';

    var auth = {
        auth: {
            api_key: 'key-a926de809033458f2307afea7a750f27',
            domain: 'sandbox4f948d71875d4d63af0aeebc1a63219a.mailgun.org'
        }
    };

    var nodemailerMailgun = nodemailer.createTransport(mg(auth));

    var callback = function (err, info) {
        if (err) {
            return next(err);
        }
        res.json(options.message);
    };

    nodemailerMailgun.sendMail(options, callback);
};