import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { connectMongoDB } from "../lib/mongodb.server";
import { Student } from "../models/student.server";
import { Enrollment } from "../models/enrollment.server";
import mongoose from "mongoose";

export const loader = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  await connectMongoDB();

  const { id } = params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Response(JSON.stringify({ error: "Invalid student ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const student = await Student.findOne({ _id: id, shop }).lean();

  if (!student) {
    throw new Response(JSON.stringify({ error: "Student not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const enrollments = await Enrollment.find({ shop, student: id })
    .populate("course", "title status")
    .sort({ enrolledAt: -1 })
    .lean();

  return {
    student: {
      ...student,
      _id: student._id.toString(),
    },

    enrollments: enrollments.map((enrollment) => ({
      ...enrollment,
      _id: enrollment._id.toString(),
      course: enrollment.course
        ? {
            ...enrollment.course,
            _id: enrollment.course._id.toString(),
          }
        : null,
    })),
  };
};

export default function StudentDashboard() {
  const { student, enrollments } = useLoaderData();

  return (
    <s-page heading="Student Dashboard">
      {/* BACK BUTTON */}

      <s-section>
        <s-button href="/app/students" variant="secondary">
          ← Back to Students
        </s-button>
      </s-section>

      {/* STUDENT INFORMATION */}

      <s-section heading="Student Information">
        <s-stack direction="block" gap="base">
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="small">
              <s-heading>{student.name}</s-heading>

              <s-text>Email: {student.email}</s-text>

              <s-text>Phone: {student.phone || "Not provided"}</s-text>

              <s-text>Status: {student.status}</s-text>
            </s-stack>
          </s-box>

          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="small">
              <s-heading>{enrollments.length}</s-heading>

              <s-text>Total Enrollments</s-text>
            </s-stack>
          </s-box>
        </s-stack>
      </s-section>

      {/* ENROLLED COURSES */}

      <s-section heading="Enrolled Courses">
        <s-stack direction="block" gap="base">
          {enrollments.length === 0 ? (
            <s-paragraph>
              This student is not enrolled in any courses yet.
            </s-paragraph>
          ) : (
            enrollments.map((enrollment) => (
              <s-box
                key={enrollment._id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
              >
                <s-stack direction="block" gap="small">
                  <s-heading>
                    {enrollment.course?.title || "Unknown Course"}
                  </s-heading>

                  <s-text>
                    Enrollment Date:{" "}
                    {enrollment.enrolledAt
                      ? new Date(enrollment.enrolledAt).toLocaleDateString()
                      : "N/A"}
                  </s-text>

                  <s-text>
                    Course Status: {enrollment.course?.status || "N/A"}
                  </s-text>

                  <s-text>Enrollment Status: {enrollment.status}</s-text>
                </s-stack>
              </s-box>
            ))
          )}
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
