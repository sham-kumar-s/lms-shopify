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

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  await connectMongoDB();

  const courses = await Course.find({ shop })
    .sort({ createdAt: -1 })
    .lean();

  return {
    courses: courses.map((course) => ({
      ...course,
      _id: course._id.toString(),
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
    const title = formData.get("title");
    const description = formData.get("description");
    const instructor = formData.get("instructor");
    const category = formData.get("category");
    const duration = formData.get("duration");
    const status = formData.get("status");

    if (!title) {
      return {
        error: "Course title is required",
      };
    }

    await Course.create({
      shop,
      title,
      description,
      instructor,
      category,
      duration,
      status,
    });

    return {
      success: true,
      message: "Course created successfully",
    };
  }

  // =========================
  // UPDATE
  // =========================

  if (intent === "update") {
    const id = formData.get("id");
    const title = formData.get("title");
    const description = formData.get("description");
    const instructor = formData.get("instructor");
    const category = formData.get("category");
    const duration = formData.get("duration");
    const status = formData.get("status");

    if (!id || !title) {
      return {
        error: "Course ID and title are required",
      };
    }

    const updatedCourse = await Course.findOneAndUpdate(
      { _id: id, shop },
      {
        title,
        description,
        instructor,
        category,
        duration,
        status,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedCourse) {
      return {
        error: "Course not found",
      };
    }

    return {
      success: true,
      message: "Course updated successfully",
    };
  }

  // =========================
  // DELETE
  // =========================

  if (intent === "delete") {
    const id = formData.get("id");

    if (!id) {
      return {
        error: "Course ID is required",
      };
    }

    const deletedCourse = await Course.findOneAndDelete({ _id: id, shop });

    if (!deletedCourse) {
      return {
        error: "Course not found",
      };
    }

    return {
      success: true,
      message: "Course deleted successfully",
    };
  }

  return {
    error: "Invalid action",
  };
};

export default function Courses() {
  const { courses } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  return (
    <s-page heading="Courses">
      {/* =========================
          ACTION MESSAGE
      ========================= */}

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

      {/* =========================
          CREATE COURSE
      ========================= */}

      <s-section heading="Create Course">
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
            <s-text-field
              label="Course title"
              name="title"
              placeholder="Enter course title"
              required
            />

            <s-text-field
              label="Description"
              name="description"
              placeholder="Enter course description"
            />

            <s-text-field
              label="Instructor"
              name="instructor"
              placeholder="Enter instructor name"
            />

            <s-text-field
              label="Category"
              name="category"
              placeholder="e.g. Frontend Development"
            />

            <s-text-field
              label="Duration"
              name="duration"
              placeholder="e.g. 8 Weeks"
            />

            <s-select label="Status" name="status">
              <s-option value="Published">Published</s-option>
              <s-option value="Draft">Draft</s-option>
              <s-option value="Archived">Archived</s-option>
            </s-select>

            <s-button
              type="submit"
              {...(isSubmitting
                ? { loading: true }
                : {})}
            >
              Create Course
            </s-button>
          </s-stack>
        </Form>
      </s-section>

      {/* =========================
          COURSE LIST
      ========================= */}

      <s-section
        heading={`Courses (${courses.length})`}
      >
        <s-stack
          direction="block"
          gap="base"
        >
          {courses.length === 0 ? (
            <s-paragraph>
              No courses found. Create your first
              course above.
            </s-paragraph>
          ) : (
            courses.map((course) => (
              <s-box
                key={course._id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
              >
                <s-stack
                  direction="block"
                  gap="base"
                >
                  {/* COURSE DETAILS */}

                  <s-heading>
                    {course.title}
                  </s-heading>

                  <s-text>
                    {course.description ||
                      "No description"}
                  </s-text>

                  <s-text>
                    Instructor:{" "}
                    {course.instructor ||
                      "Not assigned"}
                  </s-text>

                  <s-text>
                    Category:{" "}
                    {course.category ||
                      "Not specified"}
                  </s-text>

                  <s-text>
                    Duration:{" "}
                    {course.duration ||
                      "Not specified"}
                  </s-text>

                  <s-text>
                    Status: {course.status}
                  </s-text>

                  <s-text>
                    Created:{" "}
                    {course.createdAt
                      ? new Date(
                          course.createdAt,
                        ).toLocaleDateString()
                      : "N/A"}
                  </s-text>

                  {/* ACTIONS */}

                  <s-stack
                    direction="inline"
                    gap="base"
                  >
                    <s-button
                      href={`/app/courses/${course._id}`}
                      variant="secondary"
                    >
                      View Details
                    </s-button>

                    <s-button
                      onClick={() => {
                        document
                          .getElementById(
                            `edit-course-${course._id}`,
                          )
                          ?.removeAttribute(
                            "hidden",
                          );
                      }}
                    >
                      Edit
                    </s-button>

                    <Form
                      method="post"
                      onSubmit={(event) => {
                        if (
                          !window.confirm(
                            `Delete "${course.title}"? This action cannot be undone.`,
                          )
                        ) {
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
                        value={course._id}
                      />

                      <s-button
                        type="submit"
                        tone="critical"
                      >
                        Delete
                      </s-button>
                    </Form>
                  </s-stack>

                  {/* =========================
                      EDIT COURSE
                  ========================= */}

                  <div
                    id={`edit-course-${course._id}`}
                    hidden
                  >
                    <s-section heading="Edit Course">
                      <Form method="post">
                        <input
                          type="hidden"
                          name="intent"
                          value="update"
                        />

                        <input
                          type="hidden"
                          name="id"
                          value={course._id}
                        />

                        <s-stack
                          direction="block"
                          gap="base"
                        >
                          <s-text-field
                            label="Title"
                            name="title"
                            value={course.title}
                            required
                          />

                          <s-text-field
                            label="Description"
                            name="description"
                            value={
                              course.description ||
                              ""
                            }
                          />

                          <s-text-field
                            label="Instructor"
                            name="instructor"
                            value={
                              course.instructor ||
                              ""
                            }
                          />

                          <s-text-field
                            label="Category"
                            name="category"
                            value={
                              course.category ||
                              ""
                            }
                          />

                          <s-text-field
                            label="Duration"
                            name="duration"
                            value={
                              course.duration ||
                              ""
                            }
                          />

                          <s-select
                            label="Status"
                            name="status"
                            value={course.status}
                          >
                            <s-option value="Published">
                              Published
                            </s-option>

                            <s-option value="Draft">
                              Draft
                            </s-option>

                            <s-option value="Archived">
                              Archived
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
                              onClick={() => {
                                document
                                  .getElementById(
                                    `edit-course-${course._id}`,
                                  )
                                  ?.setAttribute(
                                    "hidden",
                                    "",
                                  );
                              }}
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