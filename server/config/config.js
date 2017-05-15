'use strict';

var path = require('path');
var rootPath = path.normalize(__dirname + '/../../');

module.exports = {
    development: {
        db: 'mongodb://127.0.0.1/photohostdb',
        rootPath: rootPath,
        port: process.env.PORT || 4000,
        secrets: {
            session: 'photo-host_super_development_secret_key'
        }
    },
    production: {
        rootPath: rootPath,
        db: 'mongodb://127.0.0.1/photohostdb',
        port: process.env.PORT || 4000,
        secrets: {
            session: 'photo-host_super_production_secret_key'
        }
    }
};