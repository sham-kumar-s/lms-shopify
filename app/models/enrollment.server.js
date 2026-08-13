import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    shop: {
      type: String,
      required: true,
      index: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Completed"],
      default: "Active",
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure unique enrollment per student/course within a shop
enrollmentSchema.index({ shop: 1, student: 1, course: 1 }, { unique: true });

// Force model refresh by deleting cached model
if (mongoose.models.Enrollment) {
  delete mongoose.models.Enrollment;
}

export const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
