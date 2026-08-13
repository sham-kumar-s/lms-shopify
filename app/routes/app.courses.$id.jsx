import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { connectMongoDB } from "../lib/mongodb.server";
import { Course } from "../models/course.server";
import { Enrollment } from "../models/enrollment.server";
import mongoose from "mongoose";

export const loader = async ({ request, params }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  await connectMongoDB();

  const { id } = params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Response(JSON.stringify({ error: "Invalid course ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const course = await Course.findOne({ _id: id, shop }).lean();

  if (!course) {
    throw new Response(JSON.stringify({ error: "Course not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const enrollments = await Enrollment.find({ shop, course: id })
    .populate("student", "name email")
    .sort({ enrolledAt: -1 })
    .lean();

  const enrollmentCount = enrollments.length;

  return {
    course: {
      ...course,
      _id: course._id.toString(),
    },

    enrollmentCount,

    enrollments: enrollments.map((enrollment) => ({
      ...enrollment,
      _id: enrollment._id.toString(),
      student: enrollment.student
        ? {
            ...enrollment.student,
            _id: enrollment.student._id.toString(),
          }
        : null,
    })),
  };
};

export default function CourseDetails() {
  const { course, enrollmentCount, enrollments } = useLoaderData();

  return (
    <s-page heading="Course Details">
      {/* BACK BUTTON */}

      <s-section>
        <s-button href="/app/courses" variant="secondary">
          ← Back to Courses
        </s-button>
      </s-section>

      {/* COURSE INFORMATION */}

      <s-section heading="Course Information">
        <s-stack direction="block" gap="base">
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="small">
              <s-heading>{course.title}</s-heading>

              <s-text>
                Description: {course.description || "No description"}
              </s-text>

              <s-text>
                Instructor: {course.instructor || "Not assigned"}
              </s-text>

              <s-text>Category: {course.category || "Not specified"}</s-text>

              <s-text>Duration: {course.duration || "Not specified"}</s-text>

              <s-text>Status: {course.status}</s-text>

              <s-text>
                Created:{" "}
                {course.createdAt
                  ? new Date(course.createdAt).toLocaleDateString()
                  : "N/A"}
              </s-text>
            </s-stack>
          </s-box>

          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="small">
              <s-heading>{enrollmentCount}</s-heading>

              <s-text>Students Enrolled</s-text>
            </s-stack>
          </s-box>
        </s-stack>
      </s-section>

      {/* ENROLLED STUDENTS */}

      <s-section heading="Enrolled Students">
        <s-stack direction="block" gap="base">
          {enrollments.length === 0 ? (
            <s-paragraph>
              No students are enrolled in this course yet.
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
                    {enrollment.student?.name || "Unknown Student"}
                  </s-heading>

                  <s-text>
                    Email: {enrollment.student?.email || "N/A"}
                  </s-text>

                  <s-text>
                    Enrollment Date:{" "}
                    {enrollment.enrolledAt
                      ? new Date(enrollment.enrolledAt).toLocaleDateString()
                      : "N/A"}
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
