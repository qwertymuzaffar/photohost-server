'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var albumSchema = new Schema({
    /**
     * ShortId
     */
    shortId: {
        type: String,
        index: true,
        // required: true,
        trim: true
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
    topic: {
        type: Schema.ObjectId,
        ref: 'Topic',
        default: new mongoose.Types.ObjectId('5746ef271784de3ffcfaef20'), // General
        required: true
    },
    author: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    image: {
        type: String
    },
    title: {
        type: String,
        trim: true
    },
    description: {
        type: String
    },
    submitIp: {
        type: String,
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
    },
    cat: Number
});

module.exports = mongoose.model('Album', albumSchema);