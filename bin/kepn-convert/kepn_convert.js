var fs = require('fs');
var extend = require('util-extend');
var _ = require('underscore');
_.mixin(require('underscore.string'));

var argv = require('minimist')(process.argv.slice(2), {'boolean': 'welsh', 'default': {'welsh': false}});

// Function to process an array of KEPN places and return an object containing
// one array of them per slug of their name, with some extraneous fields in
// each place removed.
var processKepn = function(data) {
    var processedData = {};
    var slugCounts = {};
    console.log("Parsed data, total places: " + data.length);
    // console.log(data[0]);
    _.each(data, function(place, index) {
        // Make a copy to work on
        processedPlace = extend({}, place);
        // Filter out the information we don't want
        delete processedPlace['county'];
        delete processedPlace['placeno'];
        delete processedPlace['comment'];
        // Work out the search string
        var searchString = processedPlace.placename.trim().toLowerCase();
        // Add a slug
        var slug = _.slugify(processedPlace.placename);
        if (_.isUndefined(slugCounts[slug])) {
            slugCounts[slug] = 0;
        }
        var slugCount =  slugCounts[slug];
        slugCounts[slug] = slugCount + 1;
        if(slugCount > 0) {
            slug = slug + (slugCount + 1).toString();
        }
        processedPlace['slug'] = slug;
        // Add the new place into the result object, creating the entry
        // for this slug if it doesn't exist already
        if(_.isUndefined(processedData[searchString])) {
            processedData[searchString] = [];
        }
        processedData[searchString].push(processedPlace);
    });
    return processedData;
};

// Function to process an array of Welsh KEPN places, which were supplied in a
// slightly different format to the main KEPN dataset. Returns an object
// containing one array of them per slug of their name, with some extraneous
// fields in each place removed.
var processWelshKepn = function(data) {
    var processedData = {};
    _.each(data, function(place, index) {
        // The data is helpfully *almost* in the format we want, we just have
        // to shuffle it slightly
        var slug = Object.keys(place)[0];
        var processedPlace = extend({}, place[slug][0]);

        // Filter out the information we don't want
        delete processedPlace['comment'];

        // Work out the search string
        var searchString = processedPlace.placename.trim().toLowerCase();

        // Location is given as strings not floats
        processedPlace['lat'] = parseFloat(processedPlace['lat']);
        processedPlace['lng'] = parseFloat(processedPlace['lng']);

        // Add the new place into the result object, creating the entry
        // for this slug if it doesn't exist already
        if(_.isUndefined(processedData[searchString])) {
            processedData[searchString] = [];
        }
        processedData[searchString].push(processedPlace);
    });
    return processedData;
};

fs.readFile(argv['in'], 'utf8', function(err, data) {
    var processedKepn, processedKepnJSON;
    if(err) {
        console.log(err);
    }
    console.log("Processing file: " + argv['in']);
    if(argv['welsh']) {
        processedKepn = processWelshKepn(JSON.parse(data));
    } else {
        processedKepn = processKepn(JSON.parse(data));
    }
    processedKepnJSON = JSON.stringify(processedKepn, null, 4);
    fs.writeFile(argv['out'], processedKepnJSON, function(err, data) {
        if(err) {
            console.log(err);
        } else {
            console.log("Finished");
        }
    });
});
