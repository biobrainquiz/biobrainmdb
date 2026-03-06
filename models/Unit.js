const mongoose = require("mongoose");
const { validateExistence, cascadeDelete } = require("../utils/dbHelpers");

const unitSchema = new mongoose.Schema({

    examcode: { type: String, required: true, uppercase: true, trim: true },
    subjectcode: { type: String, required: true, uppercase: true, trim: true },

    unitcode: { type: String, required: true, uppercase: true, trim: true },
    unitname: { type: String, required: true, trim: true },

    // population references
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true }

}, { timestamps: true });


// Unique unit per subject per exam
unitSchema.index(
    { examcode: 1, subjectcode: 1, unitcode: 1 },
    { unique: true }
);


// Pre-save validation
unitSchema.pre("save", async function () {

    const Exam = require("./Exam");
    const Subject = require("./Subject");

    await validateExistence(
        Exam,
        { examcode: this.examcode },
        `Exam ${this.examcode} does not exist`
    );

    await validateExistence(
        Subject,
        { examcode: this.examcode, subjectcode: this.subjectcode },
        `Subject ${this.subjectcode} does not exist in Exam ${this.examcode}`
    );

});


// Cascade delete Topics and Questions
unitSchema.pre("findOneAndDelete", async function () {

    const filter = this.getFilter();

    const Unit = mongoose.model("Unit");
    const unit = await Unit.findOne(filter);

    if (!unit) return;

    const Topic = require("./Topic");
    const Question = require("./Question");

    await cascadeDelete(Topic, {
        examcode: unit.examcode,
        subjectcode: unit.subjectcode,
        unitcode: unit.unitcode
    });

    await cascadeDelete(Question, {
        examcode: unit.examcode,
        subjectcode: unit.subjectcode,
        unitcode: unit.unitcode
    });

});

module.exports = mongoose.model("Unit", unitSchema);