import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";

import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

import { connectMongoDB } from "../lib/mongodb.server";

import { Course } from "../models/course.server";
import { Student } from "../models/student.server";
import { Enrollment } from "../models/enrollment.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  await connectMongoDB();

  const [students, courses, enrollments] = await Promise.all([
    Student.find({ shop })
      .sort({ name: 1 })
      .lean(),

    Course.find({ shop })
      .sort({ title: 1 })
      .lean(),

    Enrollment.find({ shop })
      .populate("student", "name email")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    students: students.map((student) => ({
      ...student,
      _id: student._id.toString(),
    })),

    courses: courses.map((course) => ({
      ...course,
      _id: course._id.toString(),
    })),

    enrollments: enrollments.map((enrollment) => ({
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
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  await connectMongoDB();

  const formData = await request.formData();

  const intent = formData.get("intent");

  // =========================
  // CREATE ENROLLMENT
  // =========================

  if (intent === "create") {
    const studentId = formData.get("student");
    const courseId = formData.get("course");
    const status = formData.get("status");

    if (!studentId || !courseId) {
      return {
        error: "Student and course are required",
      };
    }

    const student = await Student.findOne({ _id: studentId, shop });

    if (!student) {
      return {
        error: "Student not found",
      };
    }

    const course = await Course.findOne({ _id: courseId, shop });

    if (!course) {
      return {
        error: "Course not found",
      };
    }

    const existingEnrollment = await Enrollment.findOne({
      shop,
      student: studentId,
      course: courseId,
    });

    if (existingEnrollment) {
      return {
        error: "This student is already enrolled in this course",
      };
    }

    await Enrollment.create({
      shop,
      student: studentId,
      course: courseId,
      status: status || "Active",
    });

    return {
      success: true,
      message: "Student enrolled successfully",
    };
  }

  // =========================
  // UPDATE ENROLLMENT
  // =========================

  if (intent === "update") {
    const id = formData.get("id");
    const studentId = formData.get("student");
    const courseId = formData.get("course");
    const status = formData.get("status");

    if (!id || !studentId || !courseId) {
      return {
        error: "Enrollment, student, and course are required",
      };
    }

    // Verify student belongs to shop
    const student = await Student.findOne({ _id: studentId, shop });
    if (!student) {
      return {
        error: "Student not found",
      };
    }

    // Verify course belongs to shop
    const course = await Course.findOne({ _id: courseId, shop });
    if (!course) {
      return {
        error: "Course not found",
      };
    }

    const existingEnrollment = await Enrollment.findOne({
      shop,
      student: studentId,
      course: courseId,
      _id: { $ne: id },
    });

    if (existingEnrollment) {
      return {
        error: "This student is already enrolled in this course",
      };
    }

    const updatedEnrollment =
      await Enrollment.findOneAndUpdate(
        { _id: id, shop },
        {
          student: studentId,
          course: courseId,
          status,
        },
        {
          new: true,
          runValidators: true,
        },
      );

    if (!updatedEnrollment) {
      return {
        error: "Enrollment not found",
      };
    }

    return {
      success: true,
      message: "Enrollment updated successfully",
    };
  }

  // =========================
  // DELETE ENROLLMENT
  // =========================

  if (intent === "delete") {
    const id = formData.get("id");

    if (!id) {
      return {
        error: "Enrollment ID is required",
      };
    }

    const deletedEnrollment =
      await Enrollment.findOneAndDelete({ _id: id, shop });

    if (!deletedEnrollment) {
      return {
        error: "Enrollment not found",
      };
    }

    return {
      success: true,
      message: "Enrollment deleted successfully",
    };
  }

  return {
    error: "Invalid action",
  };
};

export default function Enrollments() {
  const {
    students,
    courses,
    enrollments,
  } = useLoaderData();

  const actionData = useActionData();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  const showEditForm = (enrollmentId) => {
    document
      .getElementById(`edit-enrollment-${enrollmentId}`)
      ?.removeAttribute("hidden");
  };

  const hideEditForm = (enrollmentId) => {
    document
      .getElementById(`edit-enrollment-${enrollmentId}`)
      ?.setAttribute("hidden", "");
  };

  return (
    <s-page heading="Enrollments">
      {/* ACTION MESSAGE */}

      {actionData?.error && (
        <s-banner tone="critical">
          {actionData.error}
        </s-banner>
      )}

      {actionData?.success && (
        <s-banner tone="success">
          {actionData.message}
        </s-banner>
      )}

      {/* CREATE ENROLLMENT */}

      <s-section heading="Create Enrollment">
        {students.length === 0 || courses.length === 0 ? (
          <s-banner tone="warning">
            You need at least one student and one course
            before creating an enrollment.
          </s-banner>
        ) : (
          <Form method="post">
            <input
              type="hidden"
              name="intent"
              value="create"
            />

            <s-stack
              direction="block"
              gap="base"
            >
              <s-select
                label="Student"
                name="student"
                required
              >
                <s-option value="">
                  Select student
                </s-option>

                {students.map((student) => (
                  <s-option
                    key={student._id}
                    value={student._id}
                  >
                    {student.name} - {student.email}
                  </s-option>
                ))}
              </s-select>

              <s-select
                label="Course"
                name="course"
                required
              >
                <s-option value="">
                  Select course
                </s-option>

                {courses.map((course) => (
                  <s-option
                    key={course._id}
                    value={course._id}
                  >
                    {course.title}
                  </s-option>
                ))}
              </s-select>

              <s-select
                label="Status"
                name="status"
              >
                <s-option value="Active">
                  Active
                </s-option>

                <s-option value="Completed">
                  Completed
                </s-option>
              </s-select>

              <s-button
                type="submit"
                {...(isSubmitting
                  ? { loading: true }
                  : {})}
              >
                Enroll Student
              </s-button>
            </s-stack>
          </Form>
        )}
      </s-section>

      {/* ENROLLMENT LIST */}

      <s-section
        heading={`Enrollments (${enrollments.length})`}
      >
        <s-stack
          direction="block"
          gap="base"
        >
          {enrollments.length === 0 ? (
            <s-paragraph>
              No enrollments found.
            </s-paragraph>
          ) : (
            enrollments.map((enrollment) => (
              <s-box
                key={enrollment._id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
              >
                <s-stack
                  direction="block"
                  gap="base"
                >
                  {/* ENROLLMENT DETAILS */}

                  <s-heading>
                    {enrollment.student?.name ||
                      "Unknown Student"}
                  </s-heading>

                  <s-text>
                    Email:{" "}
                    {enrollment.student?.email ||
                      "Unknown"}
                  </s-text>

                  <s-text>
                    Course:{" "}
                    {enrollment.course?.title ||
                      "Unknown Course"}
                  </s-text>

                  <s-text>
                    Status: {enrollment.status}
                  </s-text>

                  {/* ACTIONS */}

                  <s-stack
                    direction="inline"
                    gap="base"
                  >
                    <s-button
                      onClick={() =>
                        showEditForm(
                          enrollment._id,
                        )
                      }
                    >
                      Edit
                    </s-button>

                    <Form
                      method="post"
                      onSubmit={(event) => {
                        const confirmed =
                          window.confirm(
                            "Delete this enrollment? This action cannot be undone.",
                          );

                        if (!confirmed) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <input
                        type="hidden"
                        name="intent"
                        value="delete"
                      />

                      <input
                        type="hidden"
                        name="id"
                        value={enrollment._id}
                      />

                      <s-button
                        type="submit"
                        tone="critical"
                      >
                        Delete
                      </s-button>
                    </Form>
                  </s-stack>

                  {/* EDIT FORM */}

                  <div
                    id={`edit-enrollment-${enrollment._id}`}
                    hidden
                  >
                    <s-section heading="Edit Enrollment">
                      <Form method="post">
                        <input
                          type="hidden"
                          name="intent"
                          value="update"
                        />

                        <input
                          type="hidden"
                          name="id"
                          value={enrollment._id}
                        />

                        <s-stack
                          direction="block"
                          gap="base"
                        >
                          <s-select
                            label="Student"
                            name="student"
                            value={
                              enrollment.student?._id
                            }
                            required
                          >
                            {students.map((student) => (
                              <s-option
                                key={student._id}
                                value={student._id}
                              >
                                {student.name} -{" "}
                                {student.email}
                              </s-option>
                            ))}
                          </s-select>

                          <s-select
                            label="Course"
                            name="course"
                            value={
                              enrollment.course?._id
                            }
                            required
                          >
                            {courses.map((course) => (
                              <s-option
                                key={course._id}
                                value={course._id}
                              >
                                {course.title}
                              </s-option>
                            ))}
                          </s-select>

                          <s-select
                            label="Status"
                            name="status"
                            value={enrollment.status}
                          >
                            <s-option value="Active">
                              Active
                            </s-option>

                            <s-option value="Completed">
                              Completed
                            </s-option>
                          </s-select>

                          <s-stack
                            direction="inline"
                            gap="base"
                          >
                            <s-button type="submit">
                              Save Changes
                            </s-button>

                            <s-button
                              type="button"
                              onClick={() =>
                                hideEditForm(
                                  enrollment._id,
                                )
                              }
                            >
                              Cancel
                            </s-button>
                          </s-stack>
                        </s-stack>
                      </Form>
                    </s-section>
                  </div>
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