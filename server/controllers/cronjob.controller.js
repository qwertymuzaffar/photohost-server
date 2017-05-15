'use strict';

//------------------------------------------------------------------------------
//
// Private Variables
//
//------------------------------------------------------------------------------

var CronJob = require('cron').CronJob;
var galleryController = require('./gallery.controller.js');

var deleteOldPictures = new CronJob({
    cronTime: '00 00 20 * * *', // 20:00 for New York, will be 03:00 for Moscow
    onTick: function () {
        console.log('\nStarted Deleting Old Pictures.');
        galleryController.deleteByDays();

    },
    start: false,
    timeZone: 'America/New_york'
});

deleteOldPictures.start();