'use strict';

const internals = {};

exports.schemaKeys = function (parent) {

    const keys = {};
    for (let i = 0; i < parent.schema._inner.children.length; ++i) {
        const child = parent.schema._inner.children[i];
        if (child.schema._type === 'object') {
            keys[child.key] = exports.schemaKeys(child);
        }
        else {
            keys[child.key] = true;
        }
    }

    for (let i = 0; i < parent.schema._inner.renames.length; ++i) {
        const child = parent.schema._inner.renames[i];
        if (!child.options.alias) {
            keys[child.from] = false;
        }
    }

    return keys;
};

internals.parseErrors = function (err) {

    const errs = {};

    for (let i = 0; i < err.details.length; ++i) {
        const e = err.details[i];
        const path = e.path.split('.');
        let ref = errs;
        for (let j = 0; j < path.length; ++j) {
            const segment = path[j];
            if (j + 1 === path.length) {
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
    const keys = Object.keys(valid);
    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
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
