const User = require("../../models/User");
const Subject = require("../../models/Subject");
const Unit = require("../../models/Unit");
const Topic = require("../../models/Topic");
const Question = require("../../models/Question");
const QuizResult = require("../../models/QuizResult");
const Payment = require("../../models/Payment"); // if exists
const Exam = require("../../models/Exam");
const getDevice = require("../../utils/getDevice"); // if you use device-based views

// controllers/admin/examController.js
exports.list = async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 }); // newest first
    //res.render(`pages/${getDevice(req)}/admin/exams`, { exams });
  } catch (err) {
    console.error("Error fetching exams:", err);
    res.status(500).send("Server Error");
  }
};

exports.showCreate = (req, res) => {
  res.render(`pages/${getDevice(req)}/admin/addExam`);
};

exports.create = async (req, res) => {
  await Exam.create(req.body);
  res.redirect("/admin/exams");
};

exports.showEdit = async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  res.render(`pages/${getDevice(req)}/admin/editExam`, { exam });
};

exports.update = async (req, res) => {
  await Exam.findByIdAndUpdate(req.params.id, req.body);
  res.redirect("/admin/exams");
};

exports.remove = async (req, res) => {
  await Exam.findByIdAndDelete(req.params.id);
  res.redirect("/admin/exams");
};