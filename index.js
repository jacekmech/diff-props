'use strict';

var props = require("properties");
var diff = require("deep-diff");
var Q = require("q");

module.exports = function (propsAPath, propsBPath, success, failure) {

    var propsADef = Q.defer();
    props.parse(propsAPath, {sections: true, path: true}, function(err, obj) {
        if (err) {
            propsADef.reject();
        } else {
            propsADef.resolve(obj);
        }
    });
    var propsBDef = Q.defer();
    props.parse(propsBPath, {sections: true, path: true}, function(err, obj) {
        if (err) {
            propsBDef.reject();
        } else {
            propsBDef.resolve(obj);
        }
    });
    Q.allSettled([propsADef.promise, propsBDef.promise]).spread(function(propsARes, propsBRes) {

		var errors = [];
		if (propsARes.state != "fulfilled") {
			errors.push({
					props: "propsA",
					path: propsAPath
				}
			);
		}

		if (propsBRes.state != "fulfilled") {
			errors.push({
					props: "propsB",
					path: propsBPath
				}
			);
        }

		if (errors.length > 0) {
			failure(errors);
			return;
		}

        var propsA = propsARes.value;
        var propsB = propsBRes.value;
        var diffRes = diff(propsB,  propsA);
        
        var diffs = [];
        for (var i = 0; i < diffRes.length; i++) {
            var diffItem = diffRes[i];
            if (diffItem.kind === "N") {
                diffs.push({type: "+", path: diffItem.path});
            } else
            if (diffItem.kind === "D") {
                diffs.push({type: "-", path: diffItem.path});
            }
        }
        
		success(diffs);
    });
};

// diff("/home/jacek/.survey", "/home/jacek/.reviews", function(diffs) {console.log(diffs);}, function(errors) {console.log(errors)});

