'use strict';

//------------------------------------------------------------------------------
//
// Private Variables
//
//------------------------------------------------------------------------------

var Topic = require('../models/topic');

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
    var callback = function (err, result) {
        if (err) {
            return next(err);
        }
        res.json({_id: result._id});
    };

    Topic.create(req.body, callback);
}

/**
 *
 * @param req
 * @param res
 */
function retrieve(req, res, next) {
    var callback = function (err, topics) {
        if (err) {
            return next(err);
        }
        res.json(topics);
    };

    Topic.find(callback);
}

/**
 *
 * @param req
 * @param res
 */
function update(req, res, next) {
    var callback = function (err, result) {
        if (err) {
            return next(err);
        }
        res.json({_id: result._id});
    };
    var body = req.body,
        id = body._id;

    Topic.findOneAndUpdate({_id: id}, body, callback);
}

/**
 *
 * @param req
 * @param res
 */
function deleteFromGroup(req, res, next) {
    var callback = function (err, result) {
        if (err) {
            return next(err);
        }
        res.json({_id: result._id});
    };

    Topic.findOneAndRemove({_id: req.params.studentId}, callback);
}

module.exports = {
    // create: create,
    retrieve: retrieve,
    // update: update,
    // deleteFromGroup: deleteFromGroup
};