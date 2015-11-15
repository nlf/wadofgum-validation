'use strict';

const Joi = require('joi');
const Utils = require('./utils');

const internals = {
    shim: {
        emit: () => Promise.resolve()
    }
};

module.exports = function (baseClass) {

    class Model extends baseClass {
        static set schema(val) {

            const schema = val.isJoi ? val : Joi.object(val);
            this.meta.set('schema', schema);

            const keys = Utils.schemaKeys({ schema });
            this.meta.set('keys', keys);
        };

        validate() {

            if (!this.constructor.meta.has('schema')) {
                return Promise.reject(new Error('No schema has been provided for model ' + this.constructor.name));
            }

            const schema = this.constructor.meta.get('schema');
            const keys = this.constructor.meta.get('keys');
            const emit = this.constructor.capabilities.has('events') ? this.constructor.emit : internals.shim.emit;

            return emit('preValidate', this).then(() => {

                const result = Joi.validate(this, schema, { abortEarly: false, allowUnknown: true });
                Utils.setValues(this, result.error, result.value, keys);

                if (result.error) {
                    throw result.error;
                }

                return this;
            }).then(() => {

                return emit('postValidate', this);
            }).then(() => {

                return this;
            });
        };
    };

    Model.capabilities.add('validation');

    return Model;
};
