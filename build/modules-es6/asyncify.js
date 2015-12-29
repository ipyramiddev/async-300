'use strict';

import isObject from '../../deps/lodash-es/lang/isObject';
import rest from '../../deps/lodash-es/function/rest';

export default function asyncify(func) {
    return rest(function (args) {
        var callback = args.pop();
        var result;
        try {
            result = func.apply(this, args);
        } catch (e) {
            return callback(e);
        }
        // if result is Promise object
        if (isObject(result) && typeof result.then === 'function') {
            result.then(function (value) {
                callback(null, value);
            })['catch'](function (err) {
                callback(err.message ? err : new Error(err));
            });
        } else {
            callback(null, result);
        }
    });
}