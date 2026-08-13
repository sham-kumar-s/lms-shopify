import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";

import { authenticate } from "../shopify.server";
import { connectMongoDB } from "../lib/mongodb.server";

import { Course } from "../models/course.server";
import { Student } from "../models/student.server";
import { Enrollment } from "../models/enrollment.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shopId = session.shop;

  await connectMongoDB();

  const [
    courseCount,
    studentCount,
    enrollmentCount,
    completedEnrollmentCount,
    inProgressEnrollmentCount,
    recentCourses,
    recentEnrollments,
  ] = await Promise.all([
    Course.countDocuments({ shop: shopId }),
    Student.countDocuments({ shop: shopId }),
    Enrollment.countDocuments({ shop: shopId }),
    Enrollment.countDocuments({ shop: shopId, status: "Completed" }),
    Enrollment.countDocuments({ shop: shopId, status: "Active" }),
    Course.find({ shop: shopId }).sort({ createdAt: -1 }).limit(5).lean(),
    Enrollment.find({ shop: shopId })
      .populate("student", "name email")
      .populate("course", "title")
      .sort({ enrolledAt: -1 })
      .limit(5)
      .lean(),
  ]);

  // Shopify Admin API
  const response = await admin.graphql(`
    query {
      shop {
        name
        email
        myshopifyDomain
      }
    }
  `);

  const responseJson = await response.json();

  const shop = responseJson.data.shop;

  return {
    stats: {
      courses: courseCount,
      students: studentCount,
      enrollments: enrollmentCount,
      completedEnrollments: completedEnrollmentCount,
      inProgressEnrollments: inProgressEnrollmentCount,
    },

    recentCourses: recentCourses.map((course) => ({
      ...course,
      _id: course._id.toString(),
    })),

    recentEnrollments: recentEnrollments.map((enrollment) => ({
      ...enrollment,
      _id: enrollment._id.toString(),
      student: enrollment.student
        ? {
            ...enrollment.student,
            _id: enrollment.student._id.toString(),
          }
        : null,
      course: enrollment.course
        ? {
            ...enrollment.course,
            _id: enrollment.course._id.toString(),
          }
        : null,
    })),

    shop,
  };
};

export default function Dashboard() {
  const { stats, recentCourses, recentEnrollments, shop } = useLoaderData();

  return (
    <s-page heading="LMS Dashboard">
      {/* =========================
          WELCOME
      ========================= */}

      <s-section>
        <s-stack direction="block" gap="base">
          <s-heading>Welcome to your LMS</s-heading>

          <s-paragraph>
            Manage your courses, students, and enrollments from one place.
          </s-paragraph>
        </s-stack>
      </s-section>

      <s-section heading="Shopify Store">
        <s-stack direction="block" gap="small">
          <s-text>Store: {shop.name}</s-text>

          <s-text>Domain: {shop.myshopifyDomain}</s-text>

          <s-text>Email: {shop.email || "Not available"}</s-text>
        </s-stack>
      </s-section>

      {/* =========================
          STATISTICS
      ========================= */}

      <s-section heading="Overview">
        <s-stack direction="inline" gap="base">
          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="small">
              <s-text>Courses</s-text>

              <s-heading>{stats.courses}</s-heading>

              <s-text>Total courses</s-text>
            </s-stack>
          </s-box>

          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="small">
              <s-text>Students</s-text>

              <s-heading>{stats.students}</s-heading>

              <s-text>Registered students</s-text>
            </s-stack>
          </s-box>

          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="small">
              <s-text>Enrollments</s-text>

              <s-heading>{stats.enrollments}</s-heading>

              <s-text>Total enrollments</s-text>
            </s-stack>
          </s-box>

          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="small">
              <s-text>Completed</s-text>

              <s-heading>{stats.completedEnrollments}</s-heading>

              <s-text>Completed enrollments</s-text>
            </s-stack>
          </s-box>

          <s-box
            padding="base"
            borderWidth="base"
            borderRadius="base"
            background="subdued"
          >
            <s-stack direction="block" gap="small">
              <s-text>In Progress</s-text>

              <s-heading>{stats.inProgressEnrollments}</s-heading>

              <s-text>Active enrollments</s-text>
            </s-stack>
          </s-box>
        </s-stack>
      </s-section>

      {/* =========================
          RECENT COURSES
      ========================= */}

      <s-section heading="Recent Courses">
        <s-stack direction="block" gap="base">
          {recentCourses.length === 0 ? (
            <s-paragraph>No courses created yet.</s-paragraph>
          ) : (
            recentCourses.map((course) => (
              <s-box
                key={course._id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
              >
                <s-stack direction="inline" gap="base">
                  <s-stack direction="block" gap="small">
                    <s-heading>{course.title}</s-heading>

                    <s-text>
                      Instructor: {course.instructor || "Not assigned"}
                    </s-text>

                    <s-text>
                      Category: {course.category || "Not specified"}
                    </s-text>

                    <s-text>
                      Duration: {course.duration || "Not specified"}
                    </s-text>

                    <s-text>Status: {course.status}</s-text>
                  </s-stack>
                </s-stack>
              </s-box>
            ))
          )}
        </s-stack>
      </s-section>

      {/* =========================
          RECENTLY ENROLLED STUDENTS
      ========================= */}

      <s-section heading="Recently Enrolled Students">
        <s-stack direction="block" gap="base">
          {recentEnrollments.length === 0 ? (
            <s-paragraph>No recent enrollments.</s-paragraph>
          ) : (
            recentEnrollments.map((enrollment) => (
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
                    Course: {enrollment.course?.title || "Unknown Course"}
                  </s-text>

                  <s-text>
                    Enrolled:{" "}
                    {enrollment.enrolledAt
                      ? new Date(enrollment.enrolledAt).toLocaleDateString()
                      : "N/A"}
                  </s-text>

                  <s-text>Status: {enrollment.status}</s-text>
                </s-stack>
              </s-box>
            ))
          )}
        </s-stack>
      </s-section>

      {/* =========================
          QUICK ACTIONS
      ========================= */}

      <s-section heading="Quick Actions">
        <s-stack direction="inline" gap="base">
          <s-button href="/app/courses">Manage Courses</s-button>

          <s-button href="/app/students" variant="secondary">
            Manage Students
          </s-button>

          <s-button href="/app/enrollments" variant="secondary">
            View Enrollments
          </s-button>
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
