const express = require("express");
const router = express.Router({ mergeParams: true });
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/expressError.js");
const Review = require("../models/review.js");
const { validateReview, isLoggedIn , isReviewAuthor} = require("../middleware.js");

// Controller
const reviewController = require("../controllers/review.js");

// Review Post route
router.post("/", isLoggedIn,
    validateReview, 
    wrapAsync(reviewController.createReview)
);

// Delete Review Route
router.delete("/:reviewId", 
    isLoggedIn, 
    isReviewAuthor,
    wrapAsync (reviewController.destroyReview)
);

module.exports = router;