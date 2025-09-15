// Here we handle uncaught exceptions
// It is necessary to crash the server in this case,
// because this node process is in an unclean state.
// Above crashing it by server.close() was optional
process.on('uncaughtException', (err) => {
  console.log('UNHANDLED Exception! 💥 Shutting down...');
  console.log(err.name, err.message);
  // Shutdown the process aka crash it
  process.exit(1);
});

import mongoose from 'mongoose';
import { app } from './app.js';

const DB = process.env.DATABASE;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => {
    console.log('DB connection successful!');
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
// .on() is an event listener/emitter that listens to a certain
// event that takes place during its process.
// Here we implemented a solution to handle unhandled rejected promises
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  // Close the server first
  server.close(() => {
    // Then shutdown the application
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});
