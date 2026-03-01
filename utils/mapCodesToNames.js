// utils/mapCodesToNames.js
const Exam = require("../models/Exam");
const Subject = require("../models/Subject");
const Unit = require("../models/Unit");
const Topic = require("../models/Topic");
const escapeHtml = require("./htmlHelpers");

/**
 * Given an array of quiz results, attach human-readable names using mapping.
 * Names are automatically HTML-escaped.
 * @param {Array} quizResults - Array of quiz result objects containing codes
 * @returns {Array} quizResults with added fields: examName, subjectName, unitName, topicName
 */
async function mapCodesToNames(quizResults) {
  if (!quizResults || quizResults.length === 0) return [];

  // 1️⃣ Collect unique codes for each master collection
  const examCodes = [...new Set(quizResults.map(q => q.examcode))];
  const subjectKeys = [...new Set(quizResults.map(q => `${q.examcode}_${q.subjectcode}`))];
  const unitKeys = [...new Set(quizResults.map(q => `${q.examcode}_${q.subjectcode}_${q.unitcode}`))];
  const topicKeys = [...new Set(quizResults.map(q => `${q.examcode}_${q.subjectcode}_${q.unitcode}_${q.topiccode}`))];

  // 2️⃣ Fetch master data in parallel
  const [exams, subjects, units, topics] = await Promise.all([
    Exam.find({ examcode: { $in: examCodes } }).lean(),
    Subject.find({
      $or: subjectKeys.map(k => {
        const [e, s] = k.split("_");
        return { examcode: e, subjectcode: s };
      })
    }).lean(),
    Unit.find({
      $or: unitKeys.map(k => {
        const [e, s, u] = k.split("_");
        return { examcode: e, subjectcode: s, unitcode: u };
      })
    }).lean(),
    Topic.find({
      $or: topicKeys.map(k => {
        const [e, s, u, t] = k.split("_");
        return { examcode: e, subjectcode: s, unitcode: u, topiccode: t };
      })
    }).lean()
  ]);

  // 3️⃣ Create mapping dictionaries
  const examMap = Object.fromEntries(exams.map(e => [e.examcode, e.examname]));
  const subjectMap = Object.fromEntries(subjects.map(s => [`${s.examcode}_${s.subjectcode}`, s.subjectname]));
  const unitMap = Object.fromEntries(units.map(u => [`${u.examcode}_${u.subjectcode}_${u.unitcode}`, u.unitname]));
  const topicMap = Object.fromEntries(topics.map(t => [`${t.examcode}_${t.subjectcode}_${t.unitcode}_${t.topiccode}`, t.topicname]));

  // 4️⃣ Attach escaped names to quiz results
  quizResults.forEach(q => {
    q.examName = escapeHtml(examMap[q.examcode] || q.examcode);
    q.subjectName = escapeHtml(subjectMap[`${q.examcode}_${q.subjectcode}`] || q.subjectcode);
    q.unitName = escapeHtml(unitMap[`${q.examcode}_${q.subjectcode}_${q.unitcode}`] || q.unitcode);
    q.topicName = escapeHtml(topicMap[`${q.examcode}_${q.subjectcode}_${q.unitcode}_${q.topiccode}`] || q.topiccode);
  });

  return quizResults;
}
module.exports = mapCodesToNames;