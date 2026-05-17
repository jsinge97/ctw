import { z } from "zod";
import { defineRoute } from "../common.js";
import { inviteUserRequestSchema, updateUserRequestSchema, userSchema } from "./users.schemas.js";
const userParams = z.object({ userId: z.string() });
export const usersContract = [
  defineRoute({ method: "GET", path: "/v1/users", summary: "List users", tags: ["users"], response: z.array(userSchema) }),
  defineRoute({ method: "POST", path: "/v1/users", summary: "Invite user", tags: ["users"], body: inviteUserRequestSchema, response: userSchema }),
  defineRoute({ method: "PATCH", path: "/v1/users/:userId", summary: "Update user", tags: ["users"], params: userParams, body: updateUserRequestSchema, response: userSchema })
];
