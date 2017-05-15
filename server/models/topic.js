'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var topicSchema = new Schema({
    key: {
        type: String,
        trim: true,
        required: true
    },
    name: {
        type: String,
        trim: true,
        required: true
    },
    description: {
        type: String
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Topic', topicSchema);
