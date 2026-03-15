const express = require("express");
const router = express.Router();
const requireLogin = require("../middleware/requireLogin");
const mocktestController = require("../controllers/mocktestController");

// initalize mocktest 
router.get(
  "/mocktest/init/:examcode/:subjectcode",
  requireLogin,
  mocktestController.init
);


// Create mocktest Order and Start mocktest
router.post(
  "/mocktest/createorder",
  requireLogin,
  mocktestController.createOrder
);

// Submit mocktest
router.post(
  "/mocktest/submit",
  requireLogin,
  mocktestController.submit
);


module.exports = router;