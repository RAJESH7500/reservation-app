const knex = require('../db/connection');

function list() {
  return knex('reservations').select('*').orderBy('reservation_time');
}
function listDate(date) {
  return knex('reservations')
    .select('*')
    .where((builder) =>
      builder.whereNot({ status: 'finished' }).where({ reservation_date: date })
    )

    .orderBy('reservation_time');
}
function read(reservationId) {
  return knex('reservations')
    .select('*')
    .where({ reservation_id: reservationId })
    .first();
}
function update(updatedReservation) {
  return knex('reservations')
    .select('*')
    .where({ reservation_id: updatedReservation.reservation_id })
    .update(updatedReservation, '*')
    .then((updatedRecord) => updatedRecord[0]);
}
function create(reservation) {
  return knex('reservations')
    .insert(reservation)
    .returning('*')
    .then((createdRecords) => createdRecords[0]);
}
function destroy(reservationId) {
  return knex('reservations').where({ reservation_id: reservationId }).del();
}

function checkStatus(reservation_id) {
  return knex('reservations')
    .select('status')
    .where({ reservation_id })
    .first();
}

function updateStatus(reservation_id, status) {
  return knex('reservations').where({ reservation_id }).update({ status }, '*');
}
function search(mobile_number) {
  return knex('reservations')
    .whereRaw(
      "translate(mobile_number, '() -', '') like ?",
      `%${mobile_number.replace(/\D/g, '')}%`
    )
    .orderBy('reservation_date');
}
module.exports = {
  list,
  read,
  update,
  create,
  destroy,
  listDate,
  checkStatus,
  updateStatus,
  search,
};
