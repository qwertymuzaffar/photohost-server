'use strict';

//------------------------------------------------------------------------------
//
// Private Variables
//
//------------------------------------------------------------------------------

var async = require('async');
var fs = require('fs');
var rootPath = './uploads';

var Album = require('../models/album');
var Gallery = require('../models/gallery');

//------------------------------------------------------------------------------
//
// Private Functions
//
//------------------------------------------------------------------------------

/**
 * TODO: When deleting Album, need to delete all pictures of this album.
 * @param id
 */
function onRemoveAlbum(id) {
    Album.findOneAndRemove({_id: id}, function (err, res) {
        if (err) {
            console.log(err);
        } else {
            console.log('Removed Album : ' + id);
        }
    })
}

/**
 * Retrieve By User Id
 * @param req
 * @param res
 */
function retrieveById(req, res, next) {
    var callback = function (err, album) {
        if (err) {
            return next(err);
        }
        res.json(album);
    };

    var albumId = req.params.albumId,
        query = {uniqId: albumId};

    if (albumId.length == 24) {
        query = {_id: albumId};
    }

    Album.findOne(query, callback);
}

/**
 * Retrieve By User Id
 * @param req
 * @param res
 */
function retrieveByUser(req, res, next) {
    var user = req.decoded && req.decoded.user;

    if (!user) {
        return next(new Error("Can\'t find user!"));
    }

    var callback = function (err, images) {
        if (err) {
            return next(err);
        }
        if (!images || !images.length) {
            return next(new Error("Can't find images for this User!"));
        }
        res.json(images);
    };

    var limit = 20,
        query = {author: user._id},
        sort = {createdDate: -1},
        skip = +(req.query.page || 0) * limit;

    Album.find(query, callback)
        .sort(sort)
        .skip(skip)
        .limit(limit);
}

/**
 * Retrieve By User Id
 * @param req
 * @param res
 */
function retrieveByAdmin(req, res, next) {

    var callback = function (err, images) {
        if (err) {
            return next(err);
        }
        if (!images || !images.length) {
            return next(new Error("Can't find Albums!"));
        }
        res.json(images);
    };

    var limit = 20,
        options = {topic: 1, title: 1, author: 1, image: 1, views: 1, createdDate: 1},
        query = {},
        sort = {},
        skip = +(req.body.page || 0) * limit;

    if (req.body.id) {
        query = {_id: req.body.id}
    }

    if (req.body.sort) {
        switch (req.body.sort) {
            case 'createdDate':
                sort = {createdDate: -1};
                break;
            case 'lastViewed':
                sort = {lastViewed: -1};
                break;
            case 'views':
                sort = {views: -1};
                break;
            case 'unViews':
                sort = {views: 1};
                break;
            default:
                sort = {createdDate: -1};
                break;
        }
    }

    Album.find(query, options, callback)
        .sort(sort)
        .skip(skip)
        .limit(limit);
}

/**
 * Retrieve By Topic
 * @param req
 * @param res
 */
function retrieveByTopic(req, res, next) {
    var callback = function (err, albums) {
        if (err) {
            return next(err);
        }
        if (!albums || !albums.length) {
            return next(new Error("Can't find albums for this Topic!"));
        }
        res.json(albums);
    };

    var limit = 20,
        options = {topic: 1, title: 1, author: 1, image: 1},
        query = {},
        skip = +(req.query.page || 0) * limit,
        sort = {views: -1},
        topic = req.params.topic;

    if (topic == 'popular') {
        sort = {createdDate: -1};
    }

    Album.find(query, options, callback)
        .populate('author', '-dummyPassword -password -activationCode')
        .sort(sort)
        .skip(skip)
        .limit(limit);
}

/**
 * Remove Album And Galleries By Id
 * @param req
 * @param res
 * @param next
 */
function removeById(req, res, next) {
    var file, thumb, square, id = req.params.id, deletingImages = [];

    function getImageName(image, imageType) {
        return image.path + '/'
            + (imageType ? image.uniqId : image._id)
            + '.' + image.extension;
    }

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

    function onDeleteImages() {
        if (deletingImages.length) {

            var deleteImage = deletingImages.pop();

            file = rootPath + '/img/' + getImageName(deleteImage, deleteImage.type);
            thumb = rootPath + '/thumbs/' + getImageName(deleteImage, deleteImage.type);
            square = rootPath + '/square/' + getImageName(deleteImage, deleteImage.type);

            async.each([file, thumb, square], onDeleteImage, function (err) {
                if (err) {
                    return next(err);
                }
                deleteImage.remove(function (err, image) {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log('\nRemoved Image Model: ' + image._id);
                        onDeleteImages();
                    }
                });
            });
        }
    }

    var callback = function (err, images) {
        if (err) {
            res.json(err);
        } else {
            deletingImages = images;
            onDeleteImages();
            onRemoveAlbum(id);
            res.json(id);
        }
    };

    Gallery.find({album: id}, callback);
}

/**
 * Update Views By Id
 * @param req
 * @param res
 * @param next
 */
function updateViews(req, res, next) {
    var callback = function (err, result) {
        if (err) {
            return next(new Error("Error!"));
        }
        res.json(result);
    };

    var albumId = req.params.albumId,
        now = Date.now(),
        query = {uniqId: albumId};

    if (albumId.length == 24) {
        query = {_id: albumId};
    }

    Album.findOneAndUpdate(query, {$set: {lastViewed: now}, $inc: {views: 1}}, callback);
}

/**
 * Get Albums Count
 * @param req
 * @param res
 */
function getCount(req, res, next) {
    var callback = function (err, result) {
        if (err) {
            return next(err);
        }
        res.json(result);
    };

    Album.count({}, callback);
}

module.exports = {
    retrieveById: retrieveById,
    retrieveByUser: retrieveByUser,
    retrieveByAdmin: retrieveByAdmin,
    retrieveByTopic: retrieveByTopic,
    deleteById: removeById,
    updateViews: updateViews,
    getCount: getCount
};