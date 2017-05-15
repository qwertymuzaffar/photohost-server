'use strict';

var mongoose = require('mongoose');

module.exports = function (config) {
    mongoose.connect(config.db, function () {
        var db = mongoose.connection;
        db.on('error', function () {
            console.log('Connection failed.');
        });
        db.once('open', function () {
            console.log('Connected to database...');
        });
    });
};