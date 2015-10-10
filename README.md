## wadofgum-validation [![Build Status](https://travis-ci.org/nlf/wadofgum-validation.svg)](https://travis-ci.org/nlf/wadofgum-validation)

A validation mixin for [wadofgum](https://github.com/nlf/wadofgum) based on [joi](https://github.com/hapijs/joi).

### Usage

After extending your model with this mixin, instances of your class will have a `validate` method. This method returns a promise that resolves when validation is complete, or throws if validation fails.

To provide a schema for validation, assign it to the `schema` property on your class. Most Joi features are covered, including type coercion, required keys, renaming keys, and more.

```js
const Wadofgum = require('wadofgum');
const Validation = require('wadofgum-validation');
const Joi = require('joi');

class Model extends Wadofgum.mixin(Validation) {};
Model.schema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().integer()
});

let model = new Model({ name: 'test', age: '45' });
model.validate().then(function () {
  model.name; // 'test'
  model.age; // 45
});
```

If the [wadofgum-events](https://github.com/nlf/wadofgum-events) mixin is also loaded, this module will emit `preValidate` and `postValidate` events.
