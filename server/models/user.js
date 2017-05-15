'use strict';

var bcrypt = require('bcrypt-nodejs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * define the schema for our user model
 */
var userSchema = Schema({
    email: {
        type: String,
        default: '',
        match: [/.+\@.+\..+/, 'Please type a valid email address'],
        required: true,
        trim: true,
        unique: true
    },
    username: {
        type: String,
        default: '',
        lowercase: true,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        default: '',
        required: true,
        trim: true
    },
    dummyPassword: {
        type: String,
        trim: true
    },
    roles: [{
        type: String,
        trim: true,
        default: 'simple'
    }],
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    familyName: {
        type: String
    },
    birthDate: {
        type: Date
    },
    gender: {
        type: Boolean
    },
    activationCode: {
        type: String,
        default: ''
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    updatedDate: {
        type: Date
    },
    lastLogIn: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    verified: {
        type: Boolean,
        default: false
    }
});

userSchema.pre('save', function (next) {
    var user = this;
    user.dummyPassword = user.password;
    user.password = this.generateHash(user.password);
    next();
});

/**
 * generating a hash
 * @param password
 */
userSchema.methods.generateHash = function (password) {
    if (password && password.length >= 6) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    }
};

/**
 * checking if password is valid
 * @param password
 */
userSchema.methods.validPassword = function (password) {
    if (password && this.password) {
        return bcrypt.compareSync(password, this.password);
    }
};

/**
 *  create the model for users and expose it to our app
 * @type {*|Model}
 */

module.exports = mongoose.model('User', userSchema);