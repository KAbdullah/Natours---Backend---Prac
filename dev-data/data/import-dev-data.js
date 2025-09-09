import dotenv from 'dotenv';
dotenv.config({ path: './../../config.env' });
import mongoose from 'mongoose';
import fs from 'fs';
import { Tour } from './../../models/tourModels.js';
import { Review } from '../../models/reviewModel.js';
import { User } from '../../models/userModel.js';

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

//Read JSON File
const tours = JSON.parse(fs.readFileSync('tours.json', 'utf-8'));
const users = JSON.parse(fs.readFileSync('users.json', 'utf-8'));
const reviews = JSON.parse(fs.readFileSync('reviews.json', 'utf-8'));

//Import Data into Database
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
};
//Delete All dta from DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
};

try {
  if (process.argv[2] === '--import') {
    await importData();
  } else if (process.argv[2] === '--delete') {
    await deleteData();
  }
} catch (err) {
  console.error(err);
} finally {
  await mongoose.disconnect();
  process.exit();
}

console.log(process.argv);
