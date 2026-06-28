const router = require("express").Router();
const {
  getListings, createListing, deleteListing,
  toggleAvailability, bookListing, updateBookingStatus, getMyListings
} = require("../Controllers/RentalController");

router.get("/", getListings);
router.post("/", createListing);
router.get("/my-listings", getMyListings);
router.delete("/:id", deleteListing);
router.patch("/:id/toggle-availability", toggleAvailability);
router.post("/:id/book", bookListing);
router.patch("/:id/booking/:bookingId", updateBookingStatus);

module.exports = router;
