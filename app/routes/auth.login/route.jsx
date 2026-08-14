import { useState } from "react";
import { Form, useActionData, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const loader = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));

  return { errors };
};

export const action = async ({ request }) => {
  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;

  const containerStyle = {
    maxWidth: "400px",
    margin: "2rem auto",
    padding: "2rem",
    border: "1px solid #e1e1e1",
    borderRadius: "8px",
    backgroundColor: "#fff",
    fontFamily: "Inter, system-ui, sans-serif"
  };

  const headingStyle = {
    margin: "0 0 1.5rem 0",
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#202223"
  };

  const fieldStyle = {
    marginBottom: "1rem"
  };

  const labelStyle = {
    display: "block",
    marginBottom: "0.5rem",
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "#202223"
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem",
    border: "1px solid #c9cccf",
    borderRadius: "4px",
    fontSize: "0.875rem",
    boxSizing: "border-box"
  };

  const errorInputStyle = {
    ...inputStyle,
    borderColor: "#d72c0d"
  };

  const detailsStyle = {
    fontSize: "0.75rem",
    color: "#6d7175",
    marginTop: "0.25rem"
  };

  const errorStyle = {
    fontSize: "0.75rem",
    color: "#d72c0d",
    marginTop: "0.25rem"
  };

  const buttonStyle = {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#008060",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
    marginTop: "0.5rem"
  };

  return (
    <div style={containerStyle}>
      <Form method="post">
        <h1 style={headingStyle}>Log in</h1>
        <div style={fieldStyle}>
          <label htmlFor="shop" style={labelStyle}>
            Shop domain
          </label>
          <input
            id="shop"
            name="shop"
            type="text"
            style={errors.shop ? errorInputStyle : inputStyle}
            value={shop}
            onChange={(e) => setShop(e.currentTarget.value)}
            autoComplete="on"
            placeholder="my-shop.myshopify.com"
          />
          <div style={detailsStyle}>example.myshopify.com</div>
          {errors.shop && (
            <div style={errorStyle}>{errors.shop}</div>
          )}
        </div>
        <button type="submit" style={buttonStyle}>
          Log in
        </button>
      </Form>
    </div>
  );
}
