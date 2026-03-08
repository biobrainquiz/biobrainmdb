const mongoose = require("mongoose");
const { validateExistence } = require("../utils/dbHelpers");

const attemptSchema = new mongoose.Schema({

    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    exampapercode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        index: true
    },

    questionids: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question"
        }
    ]

}, { timestamps: true });


// One attempt per user per exam paper
attemptSchema.index(
    { userid: 1, exampapercode: 1 },
    { unique: true }
);


// Pre-save validation
attemptSchema.pre("save", async function () {

    const User = require("./User");
    const ExamPaper = require("./ExamPaper");

    await validateExistence(
        User,
        { _id: this.userid },
        `User does not exist`
    );

    await validateExistence(
        ExamPaper,
        { exampapercode: this.exampapercode },
        `ExamPaper ${this.exampapercode} does not exist`
    );

});

module.exports = mongoose.model("Attempt", attemptSchema);