import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    shop: {
      type: String,
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    instructor: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
    },

    duration: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Published", "Draft", "Archived"],
      default: "Published",
    },
  },
  {
    timestamps: true,
  },
);

// Force model refresh by deleting cached model
if (mongoose.models.Course) {
  delete mongoose.models.Course;
}

export const Course = mongoose.model("Course", courseSchema);