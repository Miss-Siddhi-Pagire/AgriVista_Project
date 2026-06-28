const RentalListing = require("../Models/RentalListingModel");

// GET /api/rental — list all (with filters)
module.exports.getListings = async (req, res) => {
  try {
    const { state, category, available } = req.query;
    const filter = {};
    if (state) filter.state = state;
    if (category) filter.category = category;
    if (available === "true") filter.isAvailable = true;

    const listings = await RentalListing.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch listings." });
  }
};

// POST /api/rental — create listing
module.exports.createListing = async (req, res) => {
  try {
    const { ownerId, ownerName, ownerPhone, equipmentName, category, description,
      pricePerDay, location, state, district, condition } = req.body;

    if (!ownerId || !equipmentName || !category || !pricePerDay || !state || !district) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const listing = await RentalListing.create({
      ownerId, ownerName, ownerPhone, equipmentName, category,
      description, pricePerDay, location: location || `${district}, ${state}`,
      state, district, condition
    });

    res.status(201).json({ success: true, listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to create listing." });
  }
};

// DELETE /api/rental/:id
module.exports.deleteListing = async (req, res) => {
  try {
    await RentalListing.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete." });
  }
};

// PATCH /api/rental/:id/toggle-availability
module.exports.toggleAvailability = async (req, res) => {
  try {
    const listing = await RentalListing.findById(req.params.id);
    listing.isAvailable = !listing.isAvailable;
    await listing.save();
    res.json({ success: true, isAvailable: listing.isAvailable });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update." });
  }
};

// POST /api/rental/:id/book — place a booking request
module.exports.bookListing = async (req, res) => {
  try {
    const { renterId, renterName, renterPhone, fromDate, toDate, message } = req.body;
    if (!renterId || !fromDate || !toDate) {
      return res.status(400).json({ success: false, message: "Missing booking details." });
    }

    const listing = await RentalListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, message: "Listing not found." });
    if (!listing.isAvailable) return res.status(400).json({ success: false, message: "Equipment is not available." });

    listing.bookings.push({ renterId, renterName, renterPhone, fromDate, toDate, message });
    await listing.save();

    res.status(201).json({ success: true, message: "Booking request sent to owner." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to place booking." });
  }
};

// PATCH /api/rental/:id/booking/:bookingId — approve or reject
module.exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body; // "Approved" | "Rejected"
    const listing = await RentalListing.findById(req.params.id);
    const booking = listing.bookings.id(req.params.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });

    booking.status = status;
    await listing.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update booking." });
  }
};

// GET /api/rental/my-listings?ownerId=...
module.exports.getMyListings = async (req, res) => {
  try {
    const { ownerId } = req.query;
    const listings = await RentalListing.find({ ownerId }).sort({ createdAt: -1 });
    res.json({ success: true, listings });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed." });
  }
};
