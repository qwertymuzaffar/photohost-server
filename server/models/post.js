'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({
    author: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    image: {
        type: String
    },
    title: {
        type: String,
        required: true
    },
    htmlText: {
        type: String,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Post', postSchema);
