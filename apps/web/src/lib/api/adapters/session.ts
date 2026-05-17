import { api } from "../runtime.js";

export async function getCurrentSession() {
  return api.getSessioncurrent();
}
