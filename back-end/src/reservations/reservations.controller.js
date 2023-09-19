/**
 * List handler for reservation resources
 */
const moment = require('moment');
const reservatioService = require('./reservations.service');
const hasProperties = require('../errors/hasProperties');
const asyncErrorBoundary = require('../errors/asyncBoundaryError');
async function list(req, res) {
  const { date } = req.query;
  const { mobile_number } = req.query;
  if (mobile_number) {
    const dataByMobile = await reservatioService.search(mobile_number);
    return res.json({ data: dataByMobile });
  }
  if (date) {
    const dataByDate = await reservatioService.listDate(date);
    const newData = dataByDate.map((reserv) => {
      return {
        ...reserv,
        reservation_date: moment(reserv.reservation_date.toISOString()).format(
          'YYYY-MM-DD'
        ),
      };
    });

    return res.json({ data: newData });
  }
  const data = await reservatioService.list();
  // console.log("data is ", data);
  res.json({ data });
}

async function reservationExists(req, res, next) {
  const reservationId = req.params.reservation_id;
  const reservation = await reservatioService.read(reservationId);
  if (reservation) {
    res.locals.reservation = reservation;
    return next();
  }
  next({
    status: 404,
    message: `Reservation cannot be found: ${reservationId}`,
  });
}

const VALID_PROPERTIES = [
  'first_name',
  'last_name',
  'mobile_number',
  'reservation_date',
  'reservation_time',
  'people',
  'status',
];

function hasOnlyValidProperties(req, res, next) {
  const { data = {} } = req.body;

  if (Object.keys(data).length === 0) {
    return next({
      status: 400,
      message: 'data is missing',
    });
  }
  const invalidFields = Object.keys(data).filter(
    (field) => !VALID_PROPERTIES.includes(field)
  );
  if (invalidFields.length) {
    return next({
      status: 400,
      message: `Invalids fields: ${invalidFields.join(', ')}`,
    });
  }
  next();
}
const VALID_PROPERTIES_UPDATE = [
  'first_name',
  'last_name',
  'mobile_number',
  'reservation_date',
  'reservation_time',
  'people',
  'status',
  'created_at',
  'updated_at',
  'reservation_id',
];
function hasOnlyValidUpdateProperties(req, res, next) {
  const { data = {} } = req.body;

  if (Object.keys(data).length === 0) {
    return next({
      status: 400,
      message: 'data is missing',
    });
  }
  const invalidFields = Object.keys(data).filter(
    (field) => !VALID_PROPERTIES_UPDATE.includes(field)
  );
  if (invalidFields.length) {
    return next({
      status: 400,
      message: `Invalids fields: ${invalidFields.join(', ')}`,
    });
  }
  next();
}

const hasRequiredProperties = hasProperties(
  'first_name',
  'last_name',
  'mobile_number',
  'reservation_date',
  'reservation_time',
  'people'
);
function hasvalidDate(req, res, next) {
  const { data: { reservation_date } = {} } = req.body;
  const date = new Date(reservation_date);
  if (date.getTime() < new Date().getTime()) {
    return next({
      status: 400,
      message: 'Current date must be in future',
    });
  }
  if (date.getDay() === 2) {
    return next({
      status: 400,
      message: 'Restaurant is closed on Tuesday',
    });
  }
  if (moment(reservation_date, 'YYYY-MM-DD', true).isValid()) {
    return next();
  }
  next({
    status: 400,
    message: 'reservation_date is not valid',
  });
}
function hasvalidTime(req, res, next) {
  const { data: { reservation_time } = {} } = req.body;
  if (reservation_time < '10:30' || reservation_time > '21:30') {
    return next({
      status: 400,
      message: 'Invalid reservation_time',
    });
  }
  if (moment(reservation_time, 'HH:mm', true).isValid()) {
    return next();
  }
  next({
    status: 400,
    message: 'reservation_time is not valid',
  });
}
function hasvalidPeople(req, res, next) {
  const { data: { people } = {} } = req.body;
  if (people.length || people === 0) {
    return next({
      status: 400,
      message: 'people is not valid',
    });
  }
  return next();
}

function hasValidStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (status && status !== 'booked') {
    return next({
      status: 400,
      message: `invalid status: ${status}`,
    });
  }
  next();
}
async function create(req, res) {
  const { data } = req.body;

  const reservation = await reservatioService.create(data);
  reservation.reservation_date = moment(
    reservation.reservation_date.toISOString()
  ).format('YYYY-MM-DD');
  res.status(201).json({ data: reservation });
}

async function read(req, res) {
  const data = res.locals.reservation;
  res.json({ data });
}
async function checkStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  const { reservation_id } = req.params;
  const reservationStatus = await reservatioService.checkStatus(reservation_id);
  if (status === 'unknown') {
    return next({
      status: 400,
      message: `Invalid status: ${status}`,
    });
  }
  if (reservationStatus.status === 'finished') {
    return next({
      status: 400,
      message: `Invalid status: ${reservationStatus.status}`,
    });
  }
  next();
}
async function updateStatus(req, res) {
  const { data: { status } = {} } = req.body;
  const { reservation_id } = req.params;
  await reservatioService.updateStatus(reservation_id, status);
  const updatedStatus = await reservatioService.read(reservation_id);
  res.json({ data: updatedStatus });
}

async function update(req, res) {
  const data = {
    ...req.body.data,
    reservation_id: res.locals.reservation.reservation_id,
  };

  const updatedReservation = await reservatioService.update(data);
  updatedReservation.reservation_date = moment(
    updatedReservation.reservation_date.toISOString()
  ).format('YYYY-MM-DD');
  res.json({ data: updatedReservation });
}

module.exports = {
  list: [asyncErrorBoundary(list)],
  read: [asyncErrorBoundary(reservationExists), read],
  create: [
    hasOnlyValidProperties,
    hasRequiredProperties,
    hasvalidDate,
    hasvalidTime,
    hasvalidPeople,
    hasValidStatus,
    asyncErrorBoundary(create),
  ],
  update: [
    asyncErrorBoundary(reservationExists),
    hasOnlyValidUpdateProperties,
    hasRequiredProperties,
    hasvalidDate,
    hasvalidTime,
    hasvalidPeople,

    asyncErrorBoundary(update),
  ],
  updateStatus: [
    asyncErrorBoundary(reservationExists),
    asyncErrorBoundary(checkStatus),
    asyncErrorBoundary(updateStatus),
  ],
};
