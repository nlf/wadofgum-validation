'use strict';

let internals = {};

exports.schemaKeys = function (parent) {

    let keys = {};
    for (let i = 0, il = parent.schema._inner.children.length; i < il; ++i) {
        let child = parent.schema._inner.children[i];
        if (child.schema._type === 'object') {
            keys[child.key] = exports.schemaKeys(child);
        }
        else {
            keys[child.key] = true;
        }
    }

    for (let i = 0, il = parent.schema._inner.renames.length; i < il; ++i) {
        let child = parent.schema._inner.renames[i];
        if (!child.options.alias) {
            keys[child.from] = false;
        }
    }

    return keys;
};

internals.parseErrors = function (err) {

    let errs = {};

    for (let i = 0, il = err.details.length; i < il; ++i) {
        let e = err.details[i];
        let path = e.path.split('.');
        let ref = errs;
        for (let t = 0, tl = path.length; t < tl; ++t) {
            let segment = path[t];
            if (t + 1 === tl) {
                ref[segment] = true;
            }
            else {
                ref[segment] = {};
            }

            ref = ref[segment];
        }
    }

    return errs;
};

internals.setValues = function (target, source, errs, valid) {

    errs = errs || {};
    source = source || {};
    let keys = Object.keys(valid);
    for (let i = 0, il = keys.length; i < il; ++i) {
        let key = keys[i];
        if (errs[key] ||
            !valid.hasOwnProperty(key)) {

            continue;
        }

        if (valid[key] === true) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
            else {
                delete target[key];
            }
        }
        else if (valid[key] === false) {
            delete target[key];
        }
        else {
            target[key] = target[key] || {};
            internals.setValues(target[key], source[key], errs[key], valid[key]);
        }
    }
};

exports.setValues = function (obj, err, coerced, valid) {

    internals.setValues(obj, coerced, err ? internals.parseErrors(err) : {}, valid);
};
