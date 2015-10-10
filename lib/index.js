'use strict';

let Joi = require('joi');
let Utils = require('./utils');

let internals = {
    shim: {
        emit: () => Promise.resolve()
    }
};

module.exports = function (baseClass) {

    class Model extends baseClass {
        static set schema (val) {

            let schema = val.isJoi ? val : Joi.object(val);
            this.meta.set('schema', schema);

            let keys = Utils.schemaKeys({ schema });
            this.meta.set('keys', keys);
        };

        validate () {

            if (!this.constructor.meta.has('schema')) {
                return Promise.reject(new Error('No schema has been provided for model ' + this.constructor.name));
            }

            let schema = this.constructor.meta.get('schema');
            let keys = this.constructor.meta.get('keys');
            let emit = this.constructor.capabilities.has('events') ? this.constructor.emit : internals.shim.emit;

            let self = this;
            return emit('preValidate', self).then(function () {

                let result = Joi.validate(self, schema, { abortEarly: false, allowUnknown: true });
                Utils.setValues(self, result.error, result.value, keys);

                if (result.error) {
                    throw result.error;
                }

                return self;
            }).then(function () {

                return emit('postValidate', self);
            }).then(function () {

                return self;
            });
        };
    };

    Model.capabilities.add('validation');

    return Model;
};
