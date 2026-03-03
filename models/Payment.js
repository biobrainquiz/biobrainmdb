const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // 👤 References
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User",  },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: "Unit" },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },

    // Optional denormalized fields (for display, not unique)
    username: { type: String ,required: true},
    examcode: { type: String, required: true, uppercase: true, trim: true },
    subjectcode: { type: String, required: true, uppercase: true, trim: true },
    unitcode: { type: String, required: true, uppercase: true, trim: true },
    topiccode: { type: String, required: true, uppercase: true, trim: true },

    // 💰 Amount in paise
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    // 🧾 Razorpay Details
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    // 📦 What Payment Is For
    paymentFor: { type: String, enum: ["quiz", "subscription", "exam_access"], default: "quiz" },

    // 📊 Status
    status: { type: String, enum: ["created", "success", "failed", "refunded"], default: "created" },

    // 🌐 Payment Method
    method: { type: String },

    // 🧾 Accounting Fields
    paidAt: { type: Date },
    receiptNumber: { type: String, unique: true, sparse: true },
    invoiceNumber: { type: String, unique: true, sparse: true },

    // Extra metadata
    notes: { type: Object }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);