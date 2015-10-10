'use strict';

let Wadofgum = require('wadofgum');
let Events = require('wadofgum-events');
let Validation = require('..');
let Joi = require('joi');

let lab = exports.lab = require('lab').script();
let expect = require('code').expect;
let it = lab.test;

it('can be extended', function (done) {

    class User extends Wadofgum.mixin(Validation) {};
    let user = new User();
    expect(user.validate).to.exist();
    done();
});

it('errors when attempting to validate a model with no schema', function (done) {

    class User extends Wadofgum.mixin(Validation) {};
    let user = new User();

    user.validate().catch(function (err) {

        expect(err).to.exist();
        expect(err.message).to.contain('No schema');
        done();
    });
});

it('sets default values after validating', function (done) {

    class User extends Wadofgum.mixin(Validation) {};
    User.schema = {
        name: Joi.string(),
        age: Joi.number().integer().default(20)
    };

    let user = new User();
    user.validate().then(function () {

        expect(user).to.exist();
        expect(user.age).to.equal(20);

        done();
    });
});

it('converts values after calling validate', function (done) {

    class User extends Wadofgum.mixin(Validation) {};
    User.schema = {
        name: Joi.string().required(),
        age: Joi.number().integer().default(20)
    };

    let user = new User({ name: 'test', age: '30' });
    user.validate().then(function () {

        expect(user.name).to.equal('test');
        expect(user.age).to.equal(30);
        done();
    });
});

it('reports validation errors', function (done) {

    class User extends Wadofgum.mixin(Validation) {};
    User.schema = {
        name: Joi.string().required(),
        age: Joi.number().integer().default(20)
    };

    let user = new User({ age: '30' });
    user.validate().catch(function (err) {

        expect(err).to.exist();
        expect(err.message).to.contain('"name" is required');
        expect(user.age).to.equal(30);
        done();
    });
});

it('converts valid keys to the correct type when validating', function (done) {

    class User extends Wadofgum.mixin(Validation) {};
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

    let user = new User({ name: 'test', age: '30', favorites: { number: '20' } });
    user.validate().then(function () {

        expect(user.age).to.equal(30);
        expect(user.favorites.number).to.equal(20);
        done();
    });
});

it('does not alter keys which contain validation errors', function (done) {

    class User extends Wadofgum.mixin(Validation) {};
    User.schema = {
        name: Joi.string().required(),
        favorites: {
            number: Joi.number().integer()
        },
        age: Joi.number().integer().default(20)
    };

    let user = new User({ name: 'test', age: 'test', favorites: { number: 'twenty' } });
    user.validate().catch(function () {

        expect(user.favorites.number).to.equal('twenty');
        expect(user.age).to.equal('test');
        done();
    });
});

it('reports multiple errors', function (done) {

    class User extends Wadofgum.mixin(Validation) {};
    User.schema = {
        name: Joi.string().required(),
        age: Joi.number().integer().default(20)
    };

    let user = new User({ age: 'test' });
    user.validate().catch(function (err) {

        expect(err).to.exist();
        expect(err.message).to.contain('"name" is required');
        expect(err.message).to.contain('"age" must be a number');
        expect(user.age).to.equal('test');
        done();
    });
});

it('removes renamed keys when validating', function (done) {

    class User extends Wadofgum.mixin(Validation) {};
    User.schema = Joi.object({
        name: Joi.string(),
        age: Joi.number().integer()
    }).rename('_age', 'age');

    let user = new User({ _age: 30 });
    user.validate().then(function () {

        expect(user.age).to.equal(30);
        expect(user._age).to.not.exist();
        done();
    }).catch(done);
});

it('does not remove aliased renamed keys', function (done) {

    class User extends Wadofgum.mixin(Validation) {};
    User.schema = Joi.object({
        name: Joi.string(),
        age: Joi.number().integer()
    }).rename('_age', 'age', { alias: true });

    let user = new User({ _age: 30 });
    user.validate().then(function () {

        expect(user.age).to.equal(30);
        expect(user._age).to.equal(30);
        done();
    }).catch(done);
});

lab.describe('when combined with events', function () {

    it('can abort validation by returning an error in preValidate', function (done) {

        class User extends Wadofgum.mixin(Events, Validation) {};
        User.schema = {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        };

        let called = false;
        User.on('preValidate', function (model) {

            return Promise.reject(new Error('failed'));
        });

        User.on('preValidate', function (model) {

            called = true;
        });

        let user = new User({ name: 'test' });

        user.validate().catch(function (err) {

            expect(err).to.exist();
            expect(err.message).to.equal('failed');
            expect(user.age).to.not.exist();
            expect(called).to.equal(false);
            done();
        });
    });

    it('can pass through an error from postValidate', function (done) {

        class User extends Wadofgum.mixin(Events, Validation) {};
        User.schema = {
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        };

        User.on('postValidate', function (user) {

            return Promise.reject(new Error('failed'));
        });

        let user = new User({ name: 'test' });
        user.validate().catch(function (err) {

            expect(err).to.exist();
            expect(err.message).to.equal('failed');
            done();
        });
    });

    it('can use preValidate to populate model fields', function (done) {

        class User extends Wadofgum.mixin(Events, Validation) {};
        User.schema = {
            id: Joi.string().default('some_id'),
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        };

        User.on('preValidate', function (model) {

            model.id = 'other_id';
        });

        let user = new User({ name: 'test' });
        user.validate().then(function (userModel) {

            expect(userModel.id).to.equal('other_id');
            done();
        });
    });

    it('can use preValidate twice', function (done) {

        class User extends Wadofgum.mixin(Events, Validation) {};
        User.schema = {
            id: Joi.string().default('some_id'),
            name: Joi.string().required(),
            age: Joi.number().integer().default(20)
        };

        User.on('preValidate', function (model) {

            model.id = 'other_id';
        });

        User.on('preValidate', function (model) {

            model.age += 1;
        });

        let user = new User({ name: 'test', age: 20 });
        user.validate().then(function () {

            expect(user.age).to.equal(21);
            expect(user.id).to.equal('other_id');
            done();
        });
    });
});
