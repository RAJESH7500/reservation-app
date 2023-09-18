const knex = require("../db/connection");

function list() {
  return knex("tables").select("*").orderBy("table_name");
}

function read(tableId) {
  return knex("tables").select("*").where({ table_id: tableId }).first();
}

function create(table) {
  return knex("tables")
    .insert(table)
    .returning("*")
    .then((createdRecords) => createdRecords[0]);
}

function update(updatedTable) {
  return knex("tables")
    .select("*")
    .where({ table_id: updatedTable.table_id })
    .then((updatedRecord) => updatedRecord[0]);
}
function updateTable(reservation_id, table_id) {
  return knex("tables")
    .select("*")
    .where({ table_id })
    .update({ reservation_id }, "*")
    .then((updated) => updated[0]);
}

function reservationStatus(table_id) {
  return knex("tables").select("reservation_id").where({ table_id }).first();
}

function destroy(table_id) {
  return knex("tables").where({ table_id }).del();
}
module.exports = {
  list,
  read,
  create,
  update,
  updateTable,
  reservationStatus,
  destroy,
};
