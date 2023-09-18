const tablesService = require("./tables.service");
const reservationsService = require("../reservations/reservations.service");
const hasProperties = require("../errors/hasProperties");
const asyncErrorBoundary = require("../errors/asyncBoundaryError");
const knex = require("../db/connection");
async function list(req, res) {
  const data = await tablesService.list();
  res.json({ data });
}

async function tableExists(req, res, next) {
  const { table_id } = req.params;
  const table = await tablesService.read(table_id);
  if (table) {
    res.locals.table = table;
    return next();
  }
  next({
    status: 404,
    message: `Table cannot be found: ${table_id}`,
  });
}

function read(req, res) {
  const data = req.locals.table;
  res.json({ data });
}

const VALID_PROPERTIES = ["table_name", "capacity"];
function hasOnlyValidProperties(req, res, next) {
  const { data = {} } = req.body;

  const invalidFields = Object.keys(data).filter(
    (field) => !VALID_PROPERTIES.includes(field)
  );

  if (invalidFields.length) {
    return next({
      status: 400,
      message: `Invalid fields are: ${invalidFields.join(", ")}`,
    });
  }
  next();
}

const hasRequiredProperties = hasProperties("table_name", "capacity");

function hasValidCapacity(req, res, next) {
  const { data: { capacity } = {} } = req.body;
  if (capacity.length || capacity === 0) {
    return next({
      status: 400,
      message: "capacity is not valid",
    });
  }
  next();
}
function hasValidlength(req, res, next) {
  const {
    data: { table_name },
  } = req.body;
  if (table_name.length === 1) {
    return next({
      status: 400,
      message: "table_name should be more then one length",
    });
  }
  next();
}

async function hasData(req, res, next) {
  // let barTableOne = await knex("tables").where("table_name", "Bar #1").first();
  // let tableOne = await knex("tables").where("table_name", "#1").first();
  // console.log("table one", barTableOne);
  // console.log("table two", tableOne);
  const { data } = req.body;
  if (!data) {
    return next({
      status: 400,
      message: "data is missing",
    });
  }
  next();
}
async function create(req, res) {
  const { data } = req.body;
  const createdTable = await tablesService.create(data);
  res.status(201).json({ data: createdTable });
}
const hasReservationId = hasProperties("reservation_id");
async function reservationExists(req, res, next) {
  const { data: { reservation_id } = {} } = req.body;
  const reservation = await reservationsService.read(reservation_id);
  if (reservation) {
    res.locals.reservation = reservation;
    return next();
  }
  next({
    status: 404,
    message: `Reservation cannot found: ${reservation_id}`,
  });
}
function hasSufficentCapacity(req, res, next) {
  const reservation = res.locals.reservation;
  const table = res.locals.table;
  if (table.capacity >= reservation.people) {
    return next();
  }
  next({
    status: 400,
    message: "Insufficent table capacity",
  });
}
async function hasBookedReservation(req, res, next) {
  const { reservation_id } = res.locals.reservation;
  const { status } = await reservationsService.checkStatus(reservation_id);

  if (status === "seated") {
    return next({
      status: 400,
      message: "table is already occupied or seated",
    });
  }
  next();
}
async function updateReservation(req, res) {
  const { reservation_id } = res.locals.reservation;
  const table = res.locals.table;
  await tablesService.updateTable(reservation_id, table.table_id);
  // console.log("updated reservation table is ", updatetable);
  await reservationsService.updateStatus(reservation_id, "seated");

  res.sendStatus(200);
}

async function hasSeatedReservation(req, res, next) {
  // const { table_id } = res.locals.table;

  const {
    data: { reservation_id },
  } = req.body;
  const { status } = await reservationsService.checkStatus(reservation_id);

  if (status === "seated") {
    return next();
  }
  next({
    status: 400,
    message: "table is not occupied or seated",
  });
}

async function destroy(req, res) {
  const { table_id } = res.locals.table;
  const {
    data: { reservation_id },
  } = req.body;
  // await tablesService.destroy(table_id);
  console.log("reservation id", reservation_id);
  await reservationsService.updateStatus(reservation_id, "finished");
  res.sendStatus(200);
}
module.exports = {
  list,
  read: [asyncErrorBoundary(tableExists), read],
  create: [
    hasData,
    hasOnlyValidProperties,
    hasRequiredProperties,
    hasValidCapacity,
    hasValidlength,
    asyncErrorBoundary(create),
  ],
  update: [
    hasData,
    hasReservationId,
    asyncErrorBoundary(reservationExists),
    asyncErrorBoundary(tableExists),
    hasSufficentCapacity,
    asyncErrorBoundary(hasBookedReservation),
    asyncErrorBoundary(updateReservation),
  ],
  delete: [
    asyncErrorBoundary(tableExists),
    asyncErrorBoundary(hasSeatedReservation),
    asyncErrorBoundary(destroy),
  ],
};
