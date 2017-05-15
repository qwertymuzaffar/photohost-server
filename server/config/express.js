'use strict';

var bodyParser = require('body-parser');
var compress = require('compression');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');
var fs = require('fs');
var jwt = require('jsonwebtoken');
var morgan = require('morgan');
var passport = require('passport');
var rootPath = process.cwd();
var session = require('express-session');

/**
 * Import Old Database
 */
var mongoose = require('mongoose');
var Album = require('../models/album');
var Gallery = require('../models/gallery');

module.exports = function (app, express, configs) {
    app.use(morgan('dev'));
    app.use(compress());
    app.use(cookieParser());
    app.use(bodyParser.json({limit: '200mb'}));
    app.use(bodyParser.urlencoded({limit: '200mb', extended: true}));

    /**
     *  required for passport
     */
    app.use(session({
        secret: configs.secrets.session,
        resave: true,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());

    app.use(cors);
    app.use(interceptor);

    require('../controllers/cronjob.controller');

    app.use('/api', require('../api/client'));
    app.use('/admin', require('../api/admin'));
    app.use('/img', express.static(rootPath + '/uploads/img'));
    app.use('/square', express.static(rootPath + '/uploads/square'));
    app.use('/thumbs', express.static(rootPath + '/uploads/thumbs'));
    app.use('/post', express.static(rootPath + '/uploads/post'));

    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
        res.status(400);
        res.json({message: 'Not found!'});
    });

    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.json({message: err.message});
    });

    function cors(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization");
        next();
    }

    function interceptor(req, res, next) {
        var token = req.headers.authorization;
        if (token) {
            jwt.verify(token, configs.secrets.session, function (err, decoded) {
                if (err) {
                    res.status(401).json({message: "Auth failed"});
                } else {
                    req.decoded = decoded;
                    next();
                }
            });
        } else {
            next();
        }
    }

    /**
     * Import Old Database
     * Must be deleted after Importinh
     */
    //var files = require('./fpicture.json');
    //app.get('/import', function (req, res) {
    //    res.json(files.length);
    //    /*{
    //     id: '1',
    //     title: '',
    //     text: '',
    //     created: '1435477746',
    //     lastviewed: '1468725524',
    //     pictype: 'jpg',
    //     submitip: '91.218.161.74',
    //     views: '158',
    //     uniqid: 'qligtfvzbtndu3mw5x1q7x6bc',
    //     id_cat: '1',
    //     id_usercat: '8',
    //     server_id: '0' }*/
    //
    //    var aError = 0;
    //
    //    ins();
    //
    //    function ins() {
    //        var row = files.pop();
    //        var item = {
    //            title: row.title,
    //            description: row.text,
    //            uniqId: row.uniqid,
    //            submitIp: row.submitip,
    //            views: row.views,
    //            extension: row.pictype,
    //            createdDate: row.created,
    //            lastViewed: row.lastviewed,
    //            type: 1,
    //            cat: row.id_cat,
    //            image: createPath(row.created) + '/' + row.uniqid + '.' + row.pictype
    //        };
    //
    //        if (+row.id_usercat == 9) {
    //            item.topic = new mongoose.Types.ObjectId('578106320b5a2f0f867afaf0'); // Humor
    //            item.author = new mongoose.Types.ObjectId('578a493dbc1e2d481bcffa4b'); // Author Muzaffar
    //        }
    //
    //        if (row.lastviewed == 0) {
    //            item.lastViewed = row.created;
    //        }
    //
    //        Album.create(item, function (err, album) {
    //            if (err) {
    //                aError++;
    //                console.log('\n////---------album-----------///');
    //                console.log(err);
    //                console.log('\n////---------album-----------///');
    //
    //                if (files.length > 0) {
    //                    ins();
    //                } else {
    //                    console.log('\n////---------album-finished----------///');
    //                }
    //            } else {
    //                item.album = album._id;
    //                item.path = createPath(item.createdDate);
    //
    //                Gallery.create(item, function (err, gallery) {
    //                    if (err) {
    //                        console.log('\n////---------gallery-----------///');
    //                        console.log(err);
    //                        console.log('\n////---------gallery-----------///');
    //                    }
    //
    //                    if (files.length > 0) {
    //                        ins();
    //                    } else {
    //                        console.log('\n////---------gallery-finished----------///');
    //                    }
    //                });
    //            }
    //        });
    //    }
    //
    //    function createPath(date) {
    //        date = new Date(+date * 1000);
    //        return date.getFullYear() + '-'
    //            + ('0' + (date.getMonth() + 1)).slice(-2) + '/'
    //            + ('0' + date.getDate()).slice(-2);
    //    }
    //});

    //app.get('/update', function (req, res) {
    //
    //    res.json('ok');
    //    init();
    //
    //    function init() {
    //        var lastViewed,
    //            createdDate,
    //            row;
    //
    //        Gallery.find({type: 1}, function (err, gallery) {
    //            if (err) {
    //                console.log(err);
    //            } else {
    //                row = gallery;
    //                ins();
    //            }
    //        });
    //
    //        function ins() {
    //            var gallery = row.pop();
    //
    //            lastViewed = gallery.lastViewed * 1000;
    //            createdDate = gallery.createdDate * 1000;
    //
    //            Gallery.findOneAndUpdate({_id: gallery._id}, {
    //                $set: {
    //                    lastViewed: lastViewed,
    //                    createdDate: createdDate
    //                }
    //            }, function (err, result) {
    //                if (err) {
    //                    console.log('\n////---------gallery-----------///');
    //                    console.log(err);
    //                    console.log('\n////---------gallery-----------///');
    //
    //                    if (row.length > 0) {
    //                        ins();
    //                    } else {
    //                        console.log('\n////---------gallery-finished----------///');
    //                    }
    //                } else {
    //                    Album.findOneAndUpdate({_id: gallery.album}, {
    //                        $set: {
    //                            lastViewed: lastViewed,
    //                            createdDate: createdDate
    //                        }
    //                    }, function (err, result) {
    //                        if (err) {
    //                            console.log('\n////---------album-----------///');
    //                            console.log(err);
    //                            console.log('\n////---------album-----------///');
    //                        }
    //
    //                        if (row.length > 0) {
    //                            ins();
    //                        } else {
    //                            console.log('\n////---------album-finished----------///');
    //                        }
    //                    })
    //                }
    //            });
    //        }
    //    }
    //});
};