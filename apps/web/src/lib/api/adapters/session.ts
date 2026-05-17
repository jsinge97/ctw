import { api } from "../runtime.js";

export async function getCurrentSession() {
  return api.getSessioncurrent();
}

export async function login(input: { email: string; password: string }) {
  return api.postSessionlogin(input);
}

export async function logout() {
  return api.postSessionlogout({});
}
