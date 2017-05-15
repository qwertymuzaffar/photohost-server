'use strict';

//------------------------------------------------------------------------------
//
// Private Variables
//
//------------------------------------------------------------------------------

var async = require('async');
var fs = require('fs');
var rootPath = './uploads';
var lwip = require('lwip');

var Post = require('../models/post');

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
    var postData = req.body,
        image = req.body.image,
        img,
        square,
        imgPath = rootPath + "/post/img",
        squarePath = rootPath + "/post/square";

    if (req.decoded) {
        var user = req.decoded.user;
        postData.author = user._id;
        postData.image = '';
    }

    var resizeImg = function (imageFile, callback) {
        lwip.open(imageFile, function (err, imgFile) {
            var cutWidth, cutHeight,
                squareWidth = 186,
                squareHeight = 186,
                width = imgFile.width(),
                height = imgFile.height();
            if (height * squareWidth / width >= squareWidth) {
                cutWidth = width;
                cutHeight = Math.round(squareHeight * width / squareWidth);
            } else {
                cutWidth = Math.round(squareWidth * height / squareHeight);
                cutHeight = height;
            }
            imgFile.crop(cutWidth, cutHeight, function (err, crpdSquare) {
                if (err) {
                    console.log(err);
                } else {
                    /**
                     * Square Resizing Image for Topic views
                     */
                    crpdSquare.resize(squareWidth, squareHeight, function (err, rzdSquare) {
                        if (err) {
                            console.log(err);
                        } else {
                            rzdSquare.writeFile(square, function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    callback();
                                }
                            })
                        }
                    });
                }
            })
        });
    };

    var callback = function (err, post) {
        if (err) {
            return next(err);
        }
        if (!post) {
            return next(new Error("Can't add new post!"));
        }

        if (image) {
            img = imgPath + '/' + post._id + '.' + image.extension;
            square = squarePath + '/' + post._id + '.' + image.extension;

            fs.writeFile(img, image.dataURL, 'base64', function (err) {
                if (err) {
                    console.log(err);
                } else {
                    resizeImg(img, function () {
                        var path = post._id + '.' + image.extension;
                        Post.findOneAndUpdate({_id: post._id}, {$set: {image: path}}, function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                res.json({_id: post._id});
                            }
                        });
                    });
                }
            });
        } else {
            res.json({_id: post._id});
        }
    };

    Post.create(req.body, callback);
}

/**
 *
 * @param req
 * @param res
 */
function retrieve(req, res, next) {
    var callback = function (err, posts) {
        if (err) {
            return next(err);
        }
        res.json(posts);
    };

    var limit = 15,
        query = {},
        sort = {createdDate: -1},
        skip = +(req.query.page || 0) * limit;

    Post.find(query, callback)
        .sort(sort)
        .skip(skip)
        .limit(limit);
}

/**
 *
 * @param req
 * @param res
 */
function retrieveById(req, res, next) {
    var callback = function (err, post) {
        if (err) {
            return next(err);
        }
        if (!post) {
            return next(new Error("Can't find post by this id!"));
        }
        res.json(post);
    };

    var id = req.params.id;
    Post.findOne({_id: id}, callback);
}

/**
 *
 * @param req
 * @param res
 */
function update(req, res, next) {
    var callback = function (err, post) {
        if (err) {
            return next(err);
        }
        if (!post) {
            return next(new Error("Can't find and update post!"));
        }
        res.json({_id: post._id});
    };
    var body = req.body,
        id = body._id;

    Post.findOneAndUpdate({_id: id}, {$set: {title: body.title, htmlText: body.htmlText}}, callback);
}

/**
 *
 * @param req
 * @param res
 */
function remove(req, res, next) {

    function onDeleteImage(imagePath, callback) {
        fs.unlink(imagePath, function (err) {
            if (err) {
                console.log(err)
            } else {
                console.log('\nRemoved File: ' + imagePath);
            }
            callback();
        });
    }

    function onDeleteImages(post) {
        var imgPath = rootPath + "/post/img/" + post.image,
            squarePath = rootPath + "/post/square/" + post.image;

        async.each([imgPath, squarePath], onDeleteImage, function (err) {
            if (err) {
                return next(err);
            }
        });
    }

    var callback = function (err, post) {
        if (err) {
            return next(err);
        }
        if (!post) {
            return next(new Error("Can't find and remove post!"));
        }

        if (post.image && post.image != '') {
            onDeleteImages(post);
        }

        res.json(post._id);
    };

    Post.findOneAndRemove({_id: req.params.id}, callback);
}

module.exports = {
    create: create,
    retrieve: retrieve,
    retrieveById: retrieveById,
    update: update,
    delete: remove
};