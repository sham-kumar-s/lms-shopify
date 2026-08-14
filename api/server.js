import { createRequestHandler } from "@react-router/node";
import { build } from "../build/server/index.js";

export default createRequestHandler({ build });
