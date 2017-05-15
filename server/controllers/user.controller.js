'use strict';

//------------------------------------------------------------------------------
//
// Private Variables
//
//------------------------------------------------------------------------------

var User = require('../models/user');

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
function create(req, res) {
    var callback = function (err, result) {
        if (err) {
            res.status(400).json({message: err});
        } else {
            res.status(200).json({_id: result._id});
        }
    };

    User.create(req.body, callback);
}

/**
 *
 * @param req
 * @param res
 */
function retrieve(req, res) {
    var callback = function (err, result) {
        if (err) {
            res.status(400).json({message: err});
        } else {
            res.status(200).json(result);
        }
    };

    User.find(callback);
}

/**
 *
 * @param req
 * @param res
 */
function update(req, res) {
    var callback = function (err, result) {
        if (err) {
            res.status(400).json({message: err});
        } else {
            res.status(200).json({_id: result._id});
        }
    };
    var body = req.body,
        id = body._id;


    if (body.newPassword) {
        body.dummyPassword = body.newPassword;
        body.password = User.generateHash(body.newPassword);
    }

    User.findOneAndUpdate({_id: id}, req.body, callback);
}

/**
 *
 * @param req
 * @param res
 */
function remove(req, res) {
    var callback = function (err, result) {
        if (err) {
            res.status(400).json({message: err});
        } else {
            res.status(200).json({_id: result._id});
        }
    };

    User.findOneAndRemove({_id: req.params.id}, callback);
}

/**
 * Retrieve Users For Admin Panel
 * @param req
 * @param res
 */
function retrieveByAdmin(req, res) {
    var callback = function (err, users) {
        if (err) {
            return next(err);
        }
        if (!users || !users.length) {
            return next("Can't find images for this User!");
        }
        res.json(users);
    };

    var limit = 20,
        query = {},
        sort = {createdDate: -1},
        skip = +(req.query.page || 0) * limit;

    User.find(query, callback)
        .sort(sort)
        .skip(skip)
        .limit(limit);
}

/**
 * Get Users Count
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

    User.count({}, callback);
}

module.exports = {
    create: create,
    retrieve: retrieve,
    update: update,
    delete: remove,
    retrieveByAdmin: retrieveByAdmin,
    getCount: getCount
};