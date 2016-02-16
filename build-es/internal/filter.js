'use strict';

import arrayMap from 'lodash-es/_arrayMap';
import property from 'lodash-es/_baseProperty';

export default function _filter(eachfn, arr, iterator, callback) {
    var results = [];
    eachfn(arr, function (x, index, callback) {
        iterator(x, function (err, v) {
            if (err) {
                callback(err);
            }
            else {
                if (v) {
                    results.push({index: index, value: x});
                }
                callback();
            }
        });
    }, function (err) {
        if (err) {
            callback(err);
        }
        else {
            callback(null, arrayMap(results.sort(function (a, b) {
                return a.index - b.index;
            }), property('value')));
        }
    });
}
