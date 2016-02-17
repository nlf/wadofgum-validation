'use strict';

const Joi = require('joi');

module.exports = function (baseClass) {

  class Model extends baseClass {

    set schema (val) {

      const schema = val.isJoi ? val : Joi.object(val);
      this.meta.schema = schema;
    }

    get schema () {

      return this.meta.schema;
    }

    validate (obj) {

      if (!this.meta.schema) {
        return Promise.reject(new Error(`No schema has been provided for model ${this.constructor.name}`));
      }

      const schema = this.meta.schema;
      const result = Joi.validate(obj, schema, { abortEarly: false, allowUnknown: true });

      if (result.error) {
        result.error.value = result.value;
        return Promise.reject(result.error);
      }
      return Promise.resolve(result.value);
    }
  }

  Model.capabilities.add('validation');

  return Model;
};
