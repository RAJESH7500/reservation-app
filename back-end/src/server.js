const { PORT = 5001 } = process.env;

const app = require("./app");
const knex = require("./db/connection");

knex.migrate
  .latest()
  .then((migrations) => {
    console.log("migrations", migrations);
    app.listen(PORT, listener);
  })
  .catch((error) => {
    console.error(error);
    knex.destroy();
  });

function listener() {
  console.log(`Listening on Port ${PORT}!`);
  const reservation = {
    first_name: "Rick",
    last_name: "Sanchez",
    mobile_number: "202-555-0164",
    reservation_date: "2020-12-31",
    reservation_time: "20:00:00",
    people: 6,
    created_at: "2020-12-10T08:30:32.326Z",
    updated_at: "2020-12-10T08:30:32.326Z",
  };
  const expected = {
    first_name: "Mouse",
    last_name: "Whale",
    mobile_number: "1231231235",
    reservation_date: "2026-12-30",
    reservation_time: "18:00",
    people: 2,
  };
  Object.entries(expected).forEach(
    ([key, value]) => (reservation[key] = value)
  );
  console.log("reservation ", reservation);
}
