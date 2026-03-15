const PrepareTest = require("../core/PrepareTest");
const ExamSession = require("./ExamSession");

const Result = require("../models/Result");
const Question = require("../models/Question");
const QuizResult = require("../models/QuizResult");
const Attempt = require("../models/Attempt");

const logger = require("../utils/logger");
const getNextSequence = require("../utils/getNextSequence");

const {
  getExamName,
  getSubjectName,
  getUnitName,
  getTopicName
} = require("../utils/getNameByCode");


exports.init = async (req, res) => {
  try {

    const { examcode, subjectcode } = req.params;
    const username = req.session?.user?.username;
    const pageno = 1;

    const { pageResult, totalPages } =
      await getResultsForPaging(username, examcode, subjectcode, pageno);

    const resultsForGraph =
      await getResultsForGraph(username, examcode, subjectcode);

    const prepareTestObj = new PrepareTest({
      examcode,
      subjectcode,
      pageResult,
      pageno,
      totalPages,
      resultsForGraph
    });

    return prepareTestObj;

  } catch (err) {

    logger.error("Prepare Quiz Error:", err);

    const prepareTestObj = new PrepareTest({
      examcode,
      subjectcode,
      pageResult: [],
      pageno: 1,
      totalPages: 1,
      resultsForGraph: []
    });

    return prepareTestObj;
  }
};

async function getResultsForPaging(username, examcode, subjectcode, pageno) {
  const pageLimit = 5;      // no.of records per page

  let resultCount = await Result.countDocuments({
    username,
    examcode,
    subjectcode
  });

  const totalPages = Math.ceil(resultCount / pageLimit);

  pageResult = await Result.find({
    username,
    examcode,
    subjectcode
  }).sort({ createdAt: 1 })
    .skip((pageno - 1) * pageLimit)
    .limit(pageLimit)
    .lean();

  return { pageResult, totalPages };
}

async function getResultsForGraph(username, examcode, subjectcode, pageno) {
  const resultsForGraph = await Result.find({
    username,
    examcode,
    subjectcode
  }).sort({ createdAt: 1 });

  return resultsForGraph;
}

exports.createOrder = async (req, res) => {
  try {
    const { examcode, subjectcode, unitcode, topiccode, count, difficulty } = req.body;
    const questionCount = parseInt(count) || 10;

    const examSessionObj = new ExamSession({ examcode, subjectcode, unitcode, topiccode, count, difficulty });
    examSessionObj.userId = req.session?.user?._id;
    examSessionObj.userName = req.session?.user?.username;
    examSessionObj.exampaperCode = examSessionObj.getExampaperCode();
    examSessionObj.examName = await getExamName(examcode);
    examSessionObj.subjectName = await getSubjectName(examcode, subjectcode);
    examSessionObj.unitName = await getUnitName(examcode, subjectcode, unitcode);
    examSessionObj.topicName = await getTopicName(examcode, subjectcode, unitcode, topiccode);

    // Fetch random questions
    const questions = await GetRandomQuestions(examSessionObj.userId, examSessionObj.exampaperCode, examSessionObj.examCode, examSessionObj.subjectCode, examSessionObj.unitCode, examSessionObj.topicCode, examSessionObj.difficulty, examSessionObj.questionsCount);
    examSessionObj.questions = questions;
    examSessionObj.startedAt = new Date();
    return examSessionObj;

  } catch (err) {
    console.error("Create Order Error:", err);
    return null;
  }
};

async function GetRandomQuestions(userid, exampapercode, examcode, subjectcode, unitcode, topiccode, difficulty, questioncount) {

  // get attempted question ids
  const attempt = await Attempt.findOne({ userid, exampapercode });

  const attemptedIds = attempt ? attempt.questionids : [];

  const qescount = parseInt(questioncount, 10);
  let questions = await Question.aggregate([
    {
      $match: {
        examcode,
        subjectcode,
        unitcode,
        topiccode,
        difficulty_level: difficulty,
        _id: { $nin: attemptedIds }
      }
    },
    { $sample: { size: qescount } }
  ]);

  // fallback if not enough questions
  if (questions.length < qescount) {

    const moreQuestions = await Question.aggregate([
      {
        $match: {
          examcode,
          subjectcode,
          unitcode,
          topiccode,
          difficulty_level: difficulty
        }
      },
      { $sample: { size: qescount - questions.length } }
    ]);

    questions = [...questions, ...moreQuestions];
  }
  return questions;
}

exports.submit = async (req, res) => {
  try {
    const { examSession } = req.body;

    const examSessionObj = new ExamSession();

    examSessionObj.examCode = examSession.examCode;
    examSessionObj.subjectCode = examSession.subjectCode;
    examSessionObj.unitCode = examSession.unitCode;
    examSessionObj.topicCode = examSession.topicCode;
    examSessionObj.questionsCount = examSession.questionsCount;
    examSessionObj.difficulty = examSession.difficulty;

    examSessionObj.userId = examSession.userId;
    examSessionObj.userName = examSession.userName;
    examSessionObj.userEmail = req.session.user?.email;
    examSessionObj.exampaperCode = examSession.exampaperCode;
    examSessionObj.examName = examSession.examName;
    examSessionObj.subjectName = examSession.subjectName;
    examSessionObj.unitName = examSession.unitName;
    examSessionObj.topicName = examSession.topicName;

    const now1 = new Date();
    examSessionObj.examStartedAt = examSession.examStartedAt; // e.g., "2026-03-08T12:18:07.123Z"
    examSessionObj.examEndedAt = now1.toISOString(); // e.g., "2026-03-08T12:18:07.123Z"
    examSessionObj.duration = (new Date() - new Date(examSessionObj.examStartedAt)) / 1000;

    // questions & answers
    examSessionObj.questions = examSession.questions; // array of {questionId, text, options, selectedOption, correctOption, isCorrect, timeTaken}
    examSessionObj.attemptNumber = 1;
    examSessionObj.answers = examSession.answers; // { questionId: selectedOption }

    // results computation
    examSessionObj.attempted = 0;
    examSessionObj.right = 0;
    examSessionObj.wrong = 0;
    examSessionObj.skipped = 0;
    examSessionObj.positiveMarks = 0;
    examSessionObj.negativeMarks = 0;
    examSessionObj.finalScore = 0;
    examSessionObj.percentage = 0;
    examSessionObj.accuracy = 0;
    examSessionObj.calculateScore();

    // ✅ Auto-increment serial number
    const sno = await getNextSequence("quizResultCounter");

    await SaveResult(examSessionObj)

    // ✅ Save result in DB
    const newResult = new QuizResult({
      sno,
      examdate: examSessionObj.examStartedAt,
      examtime: examSessionObj.examEndedAt,
      username: examSessionObj.userName,
      examcode: examSessionObj.examCode,
      subjectcode: examSessionObj.subjectCode,
      unitcode: examSessionObj.unitCode,
      topiccode: examSessionObj.topicCode,
      difficulty: examSessionObj.difficulty,
      noq: examSessionObj.questionsCount,
      attempted: examSessionObj.attempted,
      right: examSessionObj.right,
      wrong: examSessionObj.wrong,
      score: examSessionObj.finalScore
    });

    await newResult.save();
    await UpdateAttemptedTable(examSessionObj.userId, examSessionObj.exampaperCode, examSessionObj.questions);
    return examSessionObj;
  } catch (err) {
    console.error("Quiz Submit Error:", err);
    return null;
  }
};

async function UpdateAttemptedTable(userid, exampapercode, questions) {

  // extract question ids
  const attemptedQuestionIds = questions.map(q => q._id);

  // store attempted questions
  await Attempt.updateOne(
    { userid, exampapercode },
    {
      $addToSet: {
        questionids: { $each: attemptedQuestionIds }
      }
    },
    { upsert: true }
  );
}

async function SaveResult(examSessionObj) {

  const answers = examSessionObj.answers || {};

  const resultQuestions = examSessionObj.questions.map(q => {
    const userAnswer = answers[q._id.toString()] ?? -1;
    return {
      _id: q._id,
      qno: q.qno,

      question: q.question,

      opt1: q.opt1,
      opt2: q.opt2,
      opt3: q.opt3,
      opt4: q.opt4,

      correctAnswer: q.answer,

      userAnswer,

      marks: q.marks || 1,
      negativeMarks: q.negativeMarks || 0,

      isCorrect: userAnswer === q.answer,

      timeTaken: q.timeTaken || 0
    };
  });

  // ✅ Save result in DB
  const result = new Result({
    questions: resultQuestions,
    questionsCount: resultQuestions.length,

    userId: examSessionObj.userId,
    userName: examSessionObj.userName,
    userEmail: examSessionObj.userEmail,
    examCode: examSessionObj.examCode,
    examName: examSessionObj.examName,
    subjectCode: examSessionObj.subjectCode,
    subjectName: examSessionObj.subjectName,
    unitCode: examSessionObj.unitCode,
    unitName: examSessionObj.unitName,
    topicCode: examSessionObj.topicCode,
    topicName: examSessionObj.topicName,
    testCode: examSessionObj.exampaperCode,
    attempted: examSessionObj.attempted,
    right: examSessionObj.right,
    wrong: examSessionObj.wrong,
    skipped: examSessionObj.skipped,
    positiveMarks: examSessionObj.positiveMarks,
    negativeMarks: examSessionObj.negativeMarks,
    finalScore: examSessionObj.finalScore,
    percentage: examSessionObj.percentage,
    accuracy: examSessionObj.accuracy,

    testStartedAt: examSessionObj.examStartedAt,
    testEndedAt: examSessionObj.examEndedAt,
    duration: examSessionObj.duration,

    attemptNumber: examSessionObj.attemptNumber,
    tabSwitchCount: examSessionObj.tabSwitchCount,
    device: examSessionObj.device,
    ipAddress: examSessionObj.ipAddress,
    topicStats: examSessionObj.topicStats,
    unitStats: examSessionObj.unitStats,
  });
  await result.save();
}