// CLEANED
const express = require("express");
const router = express.Router();

const requireLogin = require("../middleware/requireLogin");
const examController = require("../controllers/examController");

// Prepare Exam 
router.get(
  "/exam/prepare/:examcode/:subjectcode",
  requireLogin,
  examController.prepareExam
);

// Submit Exam
router.post(
  "/exam/submit",
  requireLogin,
  examController.submitExam
);

// Create Exam Order and Start Exam
router.post(
  "/exam/createorder",
  requireLogin,
  examController.createExamOrder
);
module.exports = router;

