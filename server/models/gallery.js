'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gallerySchema = new Schema({
    /**
     * for get by Image Short Id
     */
    shortId: {
        type: String,
        index: true,
        // required: true,
        trim: true,
        // unique: true
    },
    /**
     * UniqId for Old Database
     */
    uniqId: {
        type: String,
        index: true,
        trim: true
    },
    /**
     * for populate by Album ObjectId
     */
    album: {
        type: Schema.ObjectId,
        ref: 'Album',
        required: true
    },
    /**
     * for get by Album Short Id
     */
    albumShortId: {
        type: String,
        index: true,
        // required: true,
        trim: true
    },
    /**
     * image folder
     */
    path: {
        type: String,
        trim: true,
        required: true
    },
    title: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    extension: {
        type: String,
        required: true 
    },
    size: {
        type: Number,
        trim: true
    },
    views: {
        type: Number,
        default: 0
    },
    createdDate: {
        type: Number,
        default: Date.now
    },
    lastViewed: {
        type: Number,
        default: Date.now
    },
    type: {
        type: Number,
        default: 0  // 0 - new, 1 - old database, we use this till when all pictures will be deleted
    }
});

module.exports = mongoose.model('Gallery', gallerySchema);