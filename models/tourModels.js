import mongoose from 'mongoose';
import slugify from 'slugify';
import validator from 'validator'; //Validator library with pre-defined methods for validation
// import { User } from './userModel.js';

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour must have less or equal then 40 characters'],
      minlength: [10, 'A tour must have more or equal then 10 characters'],
      //   validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      // that val parameter here holds the value of priceDiscount
      // This is how we build a custom validator, using the validator
      // property along with a call back function
      validate: {
        validator: function (val) {
          // this only points to the current document or the
          // NEW document being created
          // Doesn't work on update - the key word this.
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now,
      select: false, //This hides the field from query results by default, avoids the +__v trap
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        // we reference the User collection here a.k.a another model to create a relationship
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// Virtual properties is calculated during runtime and doesn't exist in the actual database, so you can't query it.
//we use a regular function so we can use the this. keyword to refer to the current document(s).
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// virtual populate, to make aware the tour model of its use in the review model so we can populate the reivews
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Document Middleware: and it runs before the .save() command and the .create() but not on .insertMany()
// Also called pre and post hooks
// Here it's a pre save hook
tourSchema.pre('save', function (next) {
  // The this object is a document here
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Responsible for embedding Users who are guides in the tour document
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);

//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// Query Middleware
// The find hook turns it into query middleware
// /^find/ represents all hooks that start with find - it's regex
tourSchema.pre('/^find/', function (next) {
  // The this object is a query here
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.pre('/^find/', function (next) {
  // .populate is used for referencing, since in referencing we only need to see the actual
  // user data when we query
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

tourSchema.post('/^find/', function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  console.log(docs);
  next();
});

// Aggregation Middleware
// Adds this middleware to all the aggregate piplines
// tourSchema.pre('aggregate', function (next) {
//   this.pipline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

export const Tour = mongoose.model('Tour', tourSchema);
