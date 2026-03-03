const Unit = require("../models/Unit");
const escapeHtml = require("../utils/escapeHtml"); // adjust path if needed

exports.getUnitsByExamAndSubject = async (req, res) => {
  try {
    const { examcode, subjectcode } = req.params;

    const units = await Unit.find({ examcode, subjectcode })
      .sort({ unitcode: 1 })
      .select("unitcode unitname -_id")
      .lean();

    // Escape HTML for safety
    units.forEach(u => {
      u.unitname = escapeHtml(u.unitname);
    });

    return res.json(units);

  } catch (err) {
    console.error("Error fetching units:", err);
    return res.status(500).json([]);
  }
};