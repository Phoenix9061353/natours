const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });
///////////////////////////////////////////
//Deal with error: uncaughtException
process.on('uncaughtException', (err) => {
  const error = Object.create(err);
  console.log('UNCAUGHT EXCEPTION!💥 Shutting down...');
  console.log(error.name, error.message);
  process.exit(1);
});

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

///////////////////////////////////////////
//Start Server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//Connect DB
(async function dbConnect() {
  try {
    await mongoose.connect(DB);
    console.log('DB connection successFul!');
  } catch (err) {
    //Deal with error: unhandledRejection
    //另法：另外設 process.on('unhandledRejection', err => {...})
    console.log('UNHANDLED REJECTION!💥 Shutting down...');
    console.log(err.name, err.message);
    server.close(() => process.exit(1));
  }
})();
