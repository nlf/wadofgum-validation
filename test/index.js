'use strict';

const Wadofgum = require('wadofgum');
const Validation = require('..');
const Joi = require('joi');

const lab = exports.lab = require('lab').script();
const expect = require('code').expect;
const it = lab.test;

it('can be extended', (done) => {

  class User extends Wadofgum.mixin(Validation) {};
  const user = new User();
  expect(user.validate).to.exist();
  done();
});

it('errors when attempting to validate a model with no schema', (done) => {

  class User extends Wadofgum.mixin(Validation) {};
  const user = new User();

  user.validate().catch((err) => {

    expect(err).to.exist();
    expect(err.message).to.contain('No schema');
    done();
  });
});

it('sets default values after validating', (done) => {

  class Model extends Wadofgum.mixin(Validation) {};
  const schema = {
    name: Joi.string(),
    age: Joi.number().integer().default(20)
  };
  const User = new Model({ schema });

  expect(User.schema.isJoi).to.equal(true);

  const user = {};
  User.validate(user).then((user2) => {

    expect(user2).to.exist();
    expect(user2.age).to.equal(20);

    done();
  });
});

it('converts values after calling validate', (done) => {

  class Model extends Wadofgum.mixin(Validation) {};
  const User = new Model();
  User.schema = {
    name: Joi.string().required(),
    age: Joi.number().integer().default(20)
  };

  const user = { name: 'test', age: '30' };
  User.validate(user).then((user2) => {

    expect(user2.name).to.equal('test');
    expect(user2.age).to.equal(30);
    done();
  });
});

it('reports validation errors', (done) => {

  class Model extends Wadofgum.mixin(Validation) {};
  const User = new Model();
  User.schema = {
    name: Joi.string().required(),
    age: Joi.number().integer().default(20)
  };

  const user = { age: '30' };
  User.validate(user)
  .catch((err) => {

    expect(err).to.exist();
    expect(err.message).to.contain('"name" is required');
    expect(err.value.age).to.equal(30);
    done();
  });
});

it('converts valid keys to the correct type when validating', (done) => {

  class Model extends Wadofgum.mixin(Validation) {};
  const User = new Model();
  User.schema = {
    name: Joi.string().required(),
    favorites: {
      number: Joi.number().integer()
    },
    extras: {
      likesMelon: Joi.boolean()
    },
    age: Joi.number().integer().default(20)
  };

  const user = { name: 'test', age: '30', favorites: { number: '20' } };
  User.validate(user).then((user2) => {

    expect(user2.age).to.equal(30);
    expect(user2.favorites.number).to.equal(20);
    done();
  });
});

it('does not alter keys which contain validation errors', (done) => {

  class Model extends Wadofgum.mixin(Validation) {};
  const User = new Model();
  User.schema = {
    name: Joi.string().required(),
    favorites: {
      number: Joi.number().integer()
    },
    age: Joi.number().integer().default(20)
  };

  const user = { name: 'test', age: 'test', favorites: { number: 'twenty' } };
  User.validate(user).catch(() => {

    expect(user.favorites.number).to.equal('twenty');
    expect(user.age).to.equal('test');
    done();
  });
});

it('reports multiple errors', (done) => {

  class Model extends Wadofgum.mixin(Validation) {};
  const User = new Model();
  User.schema = {
    name: Joi.string().required(),
    age: Joi.number().integer().default(20)
  };

  const user = { age: 'test' };
  User.validate(user).catch((err) => {

    expect(err).to.exist();
    expect(err.message).to.contain('"name" is required');
    expect(err.message).to.contain('"age" must be a number');
    expect(user.age).to.equal('test');
    done();
  });
});

it('removes renamed keys when validating', (done) => {

  class Model extends Wadofgum.mixin(Validation) {}
  const User = new Model();

  User.schema = Joi.object({
    name: Joi.string(),
    age: Joi.number().integer()
  }).rename('_age', 'age');

  const user = { _age: 30 };
  User.validate(user).then((user2) => {

    expect(user2.age).to.equal(30);
    expect(user2._age).to.not.exist();
    done();
  }).catch(done);
});

it('does not remove aliased renamed keys', (done) => {

  class Model extends Wadofgum.mixin(Validation) {};
  const User = new Model();
  User.schema = Joi.object({
    name: Joi.string(),
    age: Joi.number().integer()
  }).rename('_age', 'age', { alias: true });

  const user = { _age: 30 };
  User.validate(user).then((user2) => {

    expect(user2.age).to.equal(30);
    expect(user2._age).to.equal(30);
    done();
  }).catch(done);
});

