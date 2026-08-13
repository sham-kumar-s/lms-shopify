import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";

import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { connectMongoDB } from "../lib/mongodb.server";
import { Student } from "../models/student.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  await connectMongoDB();

  const students = await Student.find({ shop }).sort({ createdAt: -1 }).lean();

  return {
    students: students.map((student) => ({
      ...student,
      _id: student._id.toString(),
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
  // CREATE
  // =========================

  if (intent === "create") {
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const status = formData.get("status");

    if (!name || !email) {
      return {
        error: "Name and email are required",
      };
    }

    const existingStudent = await Student.findOne({
      shop,
      email: email.toLowerCase(),
    });

    if (existingStudent) {
      return {
        error: "A student with this email already exists",
      };
    }

    await Student.create({
      shop,
      name,
      email,
      phone,
      status,
    });

    return {
      success: true,
      message: "Student created successfully",
    };
  }

  // =========================
  // UPDATE
  // =========================

  if (intent === "update") {
    const id = formData.get("id");
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const status = formData.get("status");

    if (!id) {
      return {
        error: "Student ID is required",
      };
    }

    if (!name || !email) {
      return {
        error: "Name and email are required",
      };
    }

    const duplicateStudent = await Student.findOne({
      shop,
      email: email.toLowerCase(),
      _id: { $ne: id },
    });

    if (duplicateStudent) {
      return {
        error: "Another student already uses this email",
      };
    }

    const updatedStudent = await Student.findOneAndUpdate(
      { _id: id, shop },
      {
        name,
        email,
        phone,
        status,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedStudent) {
      return {
        error: "Student not found",
      };
    }

    return {
      success: true,
      message: "Student updated successfully",
    };
  }

  // =========================
  // DELETE
  // =========================

  if (intent === "delete") {
    const id = formData.get("id");

    if (!id) {
      return {
        error: "Student ID is required",
      };
    }

    const deletedStudent = await Student.findOneAndDelete({ _id: id, shop });

    if (!deletedStudent) {
      return {
        error: "Student not found",
      };
    }

    return {
      success: true,
      message: "Student deleted successfully",
    };
  }

  return {
    error: "Invalid action",
  };
};

export default function Students() {
  const { students } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  const showEditForm = (studentId) => {
    document
      .getElementById(`edit-student-${studentId}`)
      ?.removeAttribute("hidden");
  };

  const hideEditForm = (studentId) => {
    document
      .getElementById(`edit-student-${studentId}`)
      ?.setAttribute("hidden", "");
  };

  return (
    <s-page heading="Students">
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

      {/* CREATE STUDENT */}

      <s-section heading="Add Student">
        <Form method="post">
          <input
            type="hidden"
            name="intent"
            value="create"
          />

          <s-stack direction="block" gap="base">
            <s-text-field
              label="Student name"
              name="name"
              placeholder="Enter student name"
              required
            />

            <s-text-field
              label="Email"
              name="email"
              type="email"
              placeholder="student@example.com"
              required
            />

            <s-text-field
              label="Phone"
              name="phone"
              placeholder="Enter phone number"
            />

            <s-select
              label="Status"
              name="status"
            >
              <s-option value="Active">
                Active
              </s-option>

              <s-option value="Inactive">
                Inactive
              </s-option>
            </s-select>

            <s-button
              type="submit"
              {...(isSubmitting ? { loading: true } : {})}
            >
              Add Student
            </s-button>
          </s-stack>
        </Form>
      </s-section>

      {/* STUDENT LIST */}

      <s-section heading={`Students (${students.length})`}>
        <s-stack direction="block" gap="base">
          {students.length === 0 ? (
            <s-paragraph>
              No students found. Add your first student above.
            </s-paragraph>
          ) : (
            students.map((student) => (
              <s-box
                key={student._id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
              >
                <s-stack direction="block" gap="base">
                  {/* STUDENT DETAILS */}

                  <s-heading>
                    {student.name}
                  </s-heading>

                  <s-text>
                    Email: {student.email}
                  </s-text>

                  <s-text>
                    Phone:{" "}
                    {student.phone || "Not provided"}
                  </s-text>

                  <s-text>
                    Status: {student.status}
                  </s-text>

                  {/* ACTIONS */}

                  <s-stack
                    direction="inline"
                    gap="base"
                  >
                    <s-button
                      href={`/app/students/${student._id}`}
                      variant="secondary"
                    >
                      View Dashboard
                    </s-button>

                    <s-button
                      onClick={() =>
                        showEditForm(student._id)
                      }
                    >
                      Edit
                    </s-button>

                    <Form
                      method="post"
                      onSubmit={(event) => {
                        const confirmed = window.confirm(
                          `Delete "${student.name}"? This action cannot be undone.`,
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
                        value={student._id}
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
                    id={`edit-student-${student._id}`}
                    hidden
                  >
                    <s-section heading="Edit Student">
                      <Form method="post">
                        <input
                          type="hidden"
                          name="intent"
                          value="update"
                        />

                        <input
                          type="hidden"
                          name="id"
                          value={student._id}
                        />

                        <s-stack
                          direction="block"
                          gap="base"
                        >
                          <s-text-field
                            label="Name"
                            name="name"
                            value={student.name}
                            required
                          />

                          <s-text-field
                            label="Email"
                            name="email"
                            type="email"
                            value={student.email}
                            required
                          />

                          <s-text-field
                            label="Phone"
                            name="phone"
                            value={
                              student.phone || ""
                            }
                          />

                          <s-select
                            label="Status"
                            name="status"
                            value={student.status}
                          >
                            <s-option value="Active">
                              Active
                            </s-option>

                            <s-option value="Inactive">
                              Inactive
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
                                  student._id,
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
