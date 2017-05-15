'use strict';

//------------------------------------------------------------------------------
//
// Private Variables
//
//------------------------------------------------------------------------------

var async = require('async');
var fs = require('fs');
var mongoose = require('mongoose');
var mkdirp = require('mkdirp');
var lwip = require('lwip');
var shortid = require('shortid');
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

//------------------------------------------------------------------------------
//
// Public Functions
//
//------------------------------------------------------------------------------

/**
 * Upload Images and Created new Gallery
 * @param req
 * @param res
 */
function create(req, res, next) {
    var albumData = req.body,
        datePath = albumData.datePath,
        filePath = rootPath + '/img/' + datePath,
        thumbPath = rootPath + '/thumbs/' + datePath,
        squarePath = rootPath + '/square/' + datePath,
        paths = [filePath, thumbPath, squarePath],
        images = albumData.images,
        result = {},
        uploadedImages = [];

    if (req.decoded) {
        var user = req.decoded.user;
        albumData.author = user._id;
    }

    albumData.shortId = shortid.generate();
    albumData.submitIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;

    onCreateAlbum();

    /**
     * Create Album
     * @returns {*}
     */
    function onCreateAlbum() {
        if (!images.length) {
            return next('There is no picture to download!');
        }

        Album.create(albumData, function (err, album) {
            if (err) {
                return next(err);
            }
            if (!album) {
                return next('Can\'t create gallery!');
            }

            result.album = album;
            onSaveImages();
        })
    }

    /**
     * Save Image
     * @param image
     */
    function onSave(image, callback) {
        image.album = result.album;
        image.albumShortId = result.album.shortId;
        image.shortId = shortid.generate();
        image.path = datePath;
        image.type = 0;

        Gallery.create(image, function (err, result) {
            if (err) {
                //TODO: Check, use console.log(err) or return next(err)
                return next(err);
            } else {
                image._id = result._id;
            }
            callback();
        })
    }

    /**
     * Save All Images Asynchronously
     */
    function onSaveImages() {
        async.each(images, onSave, function (err) {
            if (err) {
                return next(err);
            }

            async.each(paths, onCreatePath, function (err) {
                if (err) {
                    return next(err);
                }
                onUploadImages();
            });
        });
    }

    /**
     * Create / Check Path
     */
    function onCreatePath(path, callback) {
        mkdirp(path, function (err) {
            if (err) {
                return next(err);
            }
            callback();
        });
    }

    /**
     * Upload image
     * @param image
     */
    function onUpload(image, callback) {
        /**
         * TODO: Refactor: Right now, uploading does only one folder
         * @type {string}
         */
        var path = filePath + '/' + image._id + '.' + image.extension;
        var thumb = thumbPath + '/' + image._id + '.' + image.extension;
        var square = squarePath + '/' + image._id + '.' + image.extension;
        var resizeWidth, resizeHeight, width, height;

        fs.writeFile(path, image.dataURL, 'base64', function (err, uploaded) {
            if (err) {
                //TODO: Check, use console.log(err) or return next(err)
                return next(err);
            } else {
                lwip.open(path, function (err, image) {
                    /**
                     * Resizing for Thumbs
                     * @type {number}
                     */
                    resizeWidth = 180;
                    width = image.width();
                    height = image.height();
                    resizeHeight = getResizeProportions(height, width, resizeWidth);
                    image.resize(resizeWidth, resizeHeight, function (err, rzdImg) {
                        if (err) {
                            console.log(err);
                        } else {
                            rzdImg.writeFile(thumb, function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            })
                        }
                    });
                });
                lwip.open(path, function (err, image) {
                    if (err) {
                        console.log(err);
                    } else {
                        /**
                         * Crop Image for Square Resizing
                         */
                        var cutWidth, cutHeight,
                            squareWidth = 186,
                            squareHeight = 186;
                        width = image.width();
                        height = image.height();
                        if (height * squareWidth / width >= squareWidth) {
                            cutWidth = width;
                            cutHeight = Math.round(squareHeight * width / squareWidth);
                        } else {
                            cutWidth = Math.round(squareWidth * height / squareHeight);
                            cutHeight = height;
                        }
                        image.crop(cutWidth, cutHeight, function (err, crpdSquare) {
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
                                            }
                                        })
                                    }
                                });
                            }
                        })
                    }
                });
                uploadedImages.push(image._id);
            }
            callback();
        });
    }

    /**
     * Get Resize Proportions
     * @param realHeight
     * @param realWidth
     * @param resizeWidth
     * @returns {number}
     */
    function getResizeProportions(realHeight, realWidth, resizeWidth) {
        var coefficient = realWidth / resizeWidth;
        return realHeight / coefficient;
    }

    /**
     * Prepare for uploading images
     * @returns {*}
     */
    function onUploadImages() {
        async.each(images, onUpload, function (err) {
            if (err) {
                return next(err);
            }
            result.images = images;
            onCheckUploaded();
        });
    }

    /**
     * After Creating Album and Upload image(s), will respond
     * @returns {*}
     */
    function onCheckUploaded() {
        /**
         * When can't upload even one image
         */
        if (!uploadedImages.length) {
            onRemoveAlbum(result.album._id);
            return next('No one picture is uploaded!');
        }
        /**
         * When can't upload all images, respond not uploaded images (only tempId)
         */
        if (images.length !== uploadedImages.length) {
            var notUploaded = [];
            for (var i = 0; i < images.length; i++) {
                if (uploadedImages.indexOf(images[i]._id) > -1) {
                    notUploaded.push(images[i].tempId);
                }
            }
            result.notUploaded = notUploaded;
        }

        var albumImage = images[0].path + '/' + images[0]._id + '.' + images[0].extension;
        var albumTitle = images[0].title;

        Album.findOneAndUpdate({_id: result.album._id}, {image: albumImage, title: albumTitle}, function (err) {
            if (err) {
                console.log(err)
            }
        });
        /**
         * Will respond: Album, Images with _id and if exist tempId of not uploaded Images
         */
        res.json(result);
    }
}

/**
 * Update Album And Gallery By Album Id
 * @param req
 * @param res
 * @param next
 */
function updateByAlbum(req, res, next) {
    var albumData = req.body.album,
        albumId = albumData._id,
        images = req.body.images;

    Album.findOneAndUpdate({_id: albumId}, {$set: {title: albumData.title, topic: albumData.topic}} , function (err) {
        if (err) {
            return next("Error");
        } else {
            onUpdateGalleries();
        }
    });

    function onUpdate(image, callback) {

        Gallery.findOneAndUpdate({_id: image._id}, {
            $set: {
                title: image.title,
                description: image.description
            }
        }, function (err) {
            if (err) {
                return next(err);
            } else {
                callback()
            }
        });
    }

    function onUpdateGalleries() {
        async.each(images, onUpdate, function (err) {
            if (err) {
                return next(err);
            } else {
                res.json('1');
            }
        })
    }
}

/**
 * Retrieve By Id
 * @param req
 * @param res
 */
function retrieveById(req, res, next) {
    var callback = function (err, image) {
        if (err) {
            return next(err);
        }
        if (!image) {
            return next('Can\'t find image by this id');
        }
        res.json(image);
    };

    var imageId = req.params.imageId;

    // when use Mongoose ObjectId for ImageId
    if (!mongoose.Types.ObjectId.isValid(imageId)) {
        return next('ImageId is not valid!');
    }

    Gallery.findOne({_id: imageId}, callback);
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
            return next('Error');
        }
        res.json(result);
    };

    var imageId = req.params.imageId;
    var now = Date.now();

    Gallery.findOneAndUpdate({_id: imageId}, {$set: {lastViewed: now}, $inc: {views: 1}}, callback);
}

/**
 * Retrieve By Album Id
 * @param req
 * @param res
 */
function retrieveByAlbum(req, res, next) {
    var callback = function (err, images) {
        if (err) {
            return next(err);
        }
        if (!images || !images.length) {
            return next("Can't find images for this album!");
        }
        res.json(images);
    };

    var albumId = req.params.albumId,
        query = {uniqId: albumId};

    if (albumId.length == 24) {
        query = {album: albumId};
    }

    Gallery.find(query, callback);
}

/**
 * Remove Picture by Path
 * @param req
 * @param res
 */
function remove(req, res, next) {
    var file = rootPath + decodeURIComponent(req.params.path);

    fs.unlink(file, function (err) {
        if (err) {
            return next(err);
        }
        /**
         * TODO: When picture deleted, also need delete from Database where this picture is used
         */
        res.json(true);
    });
}

/**
 * Remove Picture by Days
 */
function deleteByDays() {
    var cutoff = Date.now() - (86400000 * 70),                      // 70 days ago
        oldAlbums,
        deletingAlbums = [],
        deletingImages = [];

    // get image path
    function getImageName(image, imageType) {
        return image.path + '/'
            + (imageType ? image.uniqId : image._id)
            + '.' + image.extension;
    }

    // delete image
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

    // check old album
    function onCheckOldAlbums() {
        if (oldAlbums.length) {
            var albumId = oldAlbums.pop()._id;

            // check at least one image from album, that have been viewed last ** days
            Gallery.findOne({album: albumId, lastViewed: {$gt: cutoff}}, function (err, image) {
                if (err) {
                    console.log(err);
                } else {
                    if (!image) {
                        // if doesn't exist image, add albumId to RemovingAlbums for delete
                        deletingAlbums.push(albumId);
                    }
                    // check another album
                    onCheckOldAlbums();
                }
            });
        } else {
            if (!deletingAlbums.length) {
                console.log("\nChecked all Old Albums and there are no Old Albums to delete!");
            } else {
                onDeleteAlbums();
            }
        }
    }

    function onDeleteImages() {
        if (deletingImages.length) {

            var deleteImage = deletingImages.pop();

            var file = rootPath + '/img/' + getImageName(deleteImage, deleteImage.type),
                thumb = rootPath + '/thumbs/' + getImageName(deleteImage, deleteImage.type),
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
        } else {
            onDeleteAlbums();
        }
    }

    function onDeleteAlbums() {
        if (!deletingAlbums.length) {
            console.log("\nAll Old Albums are deleted!");
        } else {
            var albumId = deletingAlbums.pop();
            // need to refactor AlbumController.removeById using promise and use here
            Gallery.find({album: albumId}, function (err, images) {
                if (err) {
                    console.log(err)
                } else {
                    deletingImages = images;
                    onDeleteImages();
                    onRemoveAlbum(albumId);
                }
            });
        }
    }

    Album.find({lastViewed: {$lt: cutoff}, topic: "5746ef271784de3ffcfaef20"}, function (err, result) {
        if (err) {
            console.log(err);
        } else {
            if (!result.length) {
                console.log("\nThere are no Old Albums to delete!");
            } else {
                oldAlbums = result;
                onCheckOldAlbums();
            }
        }
    });
}

/**
 * Retrieve Galleries For Admin Panel
 * @param req
 * @param res
 */
function retrieveByAdmin(req, res) {
    var callback = function (err, galleries) {
        if (err) {
            return next(err);
        }
        if (!galleries || !galleries.length) {
            return next("Can't find images for this User!");
        }
        res.json(galleries);
    };

    var limit = 20,
        query = {},
        sort = {createdDate: -1},
        skip = +(req.query.page || 0) * limit;

    Gallery.find(query, callback)
        .sort(sort)
        .skip(skip)
        .limit(limit);
}

/**
 * Get Galleries Count
 * @param req
 * @param res
 */
function getCount(req, res) {
    var callback = function (err, result) {
        if (err) {
            res.status(400).json({message: err});
        } else {
            res.status(200).json(result);
        }
    };

    Gallery.count({}, callback);
}

module.exports = {
    create: create,
    updateByAlbum: updateByAlbum,
    retrieveById: retrieveById,
    retrieveByAlbum: retrieveByAlbum,
    delete: remove,
    deleteByDays: deleteByDays,
    updateViews: updateViews,
    getCount: getCount,
    retrieveByAdmin: retrieveByAdmin
};