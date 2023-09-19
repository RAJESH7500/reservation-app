const reservtions = require('../fixtures/reservations');

exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex
    .raw('TRUNCATE TABLE reservations RESTART IDENTITY CASCADE')
    .then(function () {
      // Inserts seed entries
      return knex('reservations').insert(reservtions);
    });
};
