const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Lesson title is required"],
    },
    description: {
      type: String,
    },
    order: {
      type: Number,
      required: true,
    },
    content: {
      type: String, // HTML rich text
    },
    videoUrl: {
      type: String,
    },
    duration: {
      type: Number, // in minutes
    },
    resources: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resource",
      },
    ],
    quizzes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Lesson", lessonSchema);
