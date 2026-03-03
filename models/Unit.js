const mongoose = require("mongoose");
const { validateExistence, cascadeDelete } = require("../utils/dbHelpers");

const unitSchema = new mongoose.Schema({
    //u can delete examcode,subjectcode as unit is linked to exam,subject and you can get examcode,subjectcode 
    //corresponding to this unit
    examcode: { type: String, required: true, uppercase: true, trim: true},
    subjectcode: { type: String, required: true, uppercase: true, trim: true},
    
    unitcode: { type: String, required: true, uppercase: true, trim: true },
    unitname: { type: String, required: true, trim: true },

     // This enables population
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true }
}, { timestamps: true });

// Compound unique index
unitSchema.index({ examcode: 1, subjectcode: 1, unitcode: 1 }, { unique: true });

// Pre-save validation
unitSchema.pre("save", async function (next) {
    const Exam = require("./Exam");
    const Subject = require("./Subject");

    await validateExistence(Exam, { examcode: this.examcode }, `Exam ${this.examcode} does not exist`);
    await validateExistence(Subject, { examcode: this.examcode, subjectcode: this.subjectcode },
        `Subject ${this.subjectcode} does not exist in Exam ${this.examcode}`);
    next();
});

// Cascade delete topics and questions
unitSchema.pre("findOneAndDelete", async function (next) {
    const filter = this.getFilter();
    const Topic = require("./Topic");
    const Question = require("./Question");

    await cascadeDelete(Topic, { examcode: filter.examcode, subjectcode: filter.subjectcode, unitcode: filter.unitcode });
    await cascadeDelete(Question, { examcode: filter.examcode, subjectcode: filter.subjectcode, unitcode: filter.unitcode });

    next();
});

module.exports = mongoose.model("Unit", unitSchema);