const tablesService = require('./tables.service');
const reservationsService = require('../reservations/reservations.service');
const hasProperties = require('../errors/hasProperties');
const asyncErrorBoundary = require('../errors/asyncBoundaryError');

// function to get the list of all tables
async function list(req, res) {
  const data = await tablesService.list();
  res.json({ data });
}

// middleware function to check the if table exists with table id
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

// function to read the table with table id
function read(req, res) {
  const data = req.locals.table;
  res.json({ data });
}

// function to check that table should have valid property
const VALID_PROPERTIES = ['table_name', 'capacity'];
function hasOnlyValidProperties(req, res, next) {
  const { data = {} } = req.body;

  const invalidFields = Object.keys(data).filter(
    (field) => !VALID_PROPERTIES.includes(field)
  );

  if (invalidFields.length) {
    return next({
      status: 400,
      message: `Invalid fields are: ${invalidFields.join(', ')}`,
    });
  }
  next();
}

// function to check for require properties
const hasRequiredProperties = hasProperties('table_name', 'capacity');

// function to check table table has required capacity to confirm a reservation
function hasValidCapacity(req, res, next) {
  const { data: { capacity } = {} } = req.body;
  if (capacity.length || capacity === 0) {
    return next({
      status: 400,
      message: 'capacity is not valid',
    });
  }
  next();
}

// function to check that name of table should contain atlest a character
function hasValidlength(req, res, next) {
  const {
    data: { table_name },
  } = req.body;
  if (table_name.length === 1) {
    return next({
      status: 400,
      message: 'table_name should be more then one length',
    });
  }
  next();
}

// function to check that body has data object
async function hasData(req, res, next) {
  const { data } = req.body;
  if (!data) {
    return next({
      status: 400,
      message: 'data is missing',
    });
  }
  next();
}

// function to create a new table
async function create(req, res) {
  const { data } = req.body;
  const createdTable = await tablesService.create(data);
  res.status(201).json({ data: createdTable });
}

// function to check that should have the required fields
const hasReservationId = hasProperties('reservation_id');

// function to check that reservation exists with reservation id
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

// function to check for sufficent capacity
function hasSufficentCapacity(req, res, next) {
  const reservation = res.locals.reservation;
  const table = res.locals.table;
  if (table.capacity >= reservation.people) {
    return next();
  }
  next({
    status: 400,
    message: 'Insufficent table capacity',
  });
}

// function t check that reservation is already seated
async function hasBookedReservation(req, res, next) {
  const { table, reservation } = res.locals;
  if (table.reservation_id || reservation.status === 'seated') {
    return next({
      status: 400,
      message: 'table is already occupied or seated',
    });
  }
  next();
}

// function to update the status of both table and reservation
async function updateReservation(req, res) {
  const { reservation_id } = res.locals.reservation;
  const { table_id } = res.locals.table;

  // update the reservation id in the table and reservation status to seated
  await tablesService.updateTable(reservation_id, table_id);
  await reservationsService.updateStatus(reservation_id, 'seated');
  res.sendStatus(200);
}

// function to check if reservation already booked
function hasSeatedReservation(req, res, next) {
  const { table } = res.locals;
  if (table.reservation_id) {
    return next();
  }
  next({
    status: 400,
    message: 'table is not occupied or seated',
  });
}

// function to make reservation to finished and empty the table for next reservation
async function destroy(req, res) {
  const { table_id, reservation_id } = res.locals.table;
  await tablesService.updateTable(null, table_id);
  await reservationsService.updateStatus(reservation_id, 'finished');
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
    hasBookedReservation,
    asyncErrorBoundary(updateReservation),
  ],
  delete: [
    asyncErrorBoundary(tableExists),
    hasSeatedReservation,
    asyncErrorBoundary(destroy),
  ],
};
