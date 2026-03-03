// utils/getNameByCode.js
const Exam = require("../models/Exam");
const Subject = require("../models/Subject");
const Unit = require("../models/Unit");
const Topic = require("../models/Topic");
const escapeHtml = require("./escapeHtml");

/**
 * Get exam name from examcode
 * @param {string} examcode
 * @returns {Promise<string>} escaped exam name or examcode if not found
 */
async function getExamName(examcode) {
  if (!examcode) return '';
  const exam = await Exam.findOne({ examcode }).lean();
  return escapeHtml(exam ? exam.examname : examcode);
}

/**
 * Get subject name from examcode & subjectcode
 * @param {string} examcode
 * @param {string} subjectcode
 * @returns {Promise<string>} escaped subject name or subjectcode if not found
 */
async function getSubjectName(examcode, subjectcode) {
  if (!examcode || !subjectcode) return '';
  const subject = await Subject.findOne({ examcode, subjectcode }).lean();
  return escapeHtml(subject ? subject.subjectname : subjectcode);
}

/**
 * Get unit name from examcode, subjectcode & unitcode
 * @param {string} examcode
 * @param {string} subjectcode
 * @param {string} unitcode
 * @returns {Promise<string>} escaped unit name or unitcode if not found
 */
async function getUnitName(examcode, subjectcode, unitcode) {
  if (!examcode || !subjectcode || !unitcode) return '';
  const unit = await Unit.findOne({ examcode, subjectcode, unitcode }).lean();
  return escapeHtml(unit ? unit.unitname : unitcode);
}

/**
 * Get topic name from examcode, subjectcode, unitcode & topiccode
 * @param {string} examcode
 * @param {string} subjectcode
 * @param {string} unitcode
 * @param {string} topiccode
 * @returns {Promise<string>} escaped topic name or topiccode if not found
 */
async function getTopicName(examcode, subjectcode, unitcode, topiccode) {
  if (!examcode || !subjectcode || !unitcode || !topiccode) return '';
  const topic = await Topic.findOne({ examcode, subjectcode, unitcode, topiccode }).lean();
  return escapeHtml(topic ? topic.topicname : topiccode);
}

module.exports = {
  getExamName,
  getSubjectName,
  getUnitName,
  getTopicName
};