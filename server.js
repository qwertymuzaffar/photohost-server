'use strict';

var env = process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var express = require('express');
var app = express();
var http = require('http').createServer(app);

var passport = require('passport');
var configs = require('./server/config/config')[env];

require('./server/config/mongoose')(configs);
require('./server/config/passport')(passport);
require('./server/config/express')(app, express, configs);

http.listen(configs.port, function () {
    console.log('Listening on port ' + configs.port);
});