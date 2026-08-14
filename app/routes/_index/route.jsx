import { redirect, Form, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>LMS App</h1>
        <p className={styles.text}>
          Manage your courses, students and enrollments.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input 
                className={styles.input} 
                type="text" 
                name="shop" 
                placeholder="my-shop.myshopify.com"
                required
              />
              <span className={styles.hint}>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Install / Login with Shopify
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Course Management</strong>. Create and manage courses with titles, 
            descriptions, and pricing. Track course availability and enrollment limits.
          </li>
          <li>
            <strong>Student Management</strong>. Maintain student profiles with contact 
            information and enrollment history. Monitor student progress across courses.
          </li>
          <li>
            <strong>Enrollment Tracking</strong>. Track enrollments with status management, 
            completion dates, and progress monitoring. Generate enrollment reports.
          </li>
        </ul>
      </div>
    </div>
  );
}
