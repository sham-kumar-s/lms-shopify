import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    shop: {
      type: String,
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  },
);

// Compound index: email must be unique within a shop
studentSchema.index({ shop: 1, email: 1 }, { unique: true });

// Force model refresh by deleting cached model
if (mongoose.models.Student) {
  delete mongoose.models.Student;
}

export const Student = mongoose.model("Student", studentSchema);