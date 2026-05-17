import { api } from "../runtime.js";
import type { CurrentSession } from "@ctw/contracts";

export async function getCurrentSession() {
  return api.getSessioncurrent();
}

export async function login(input: { email: string; password: string }) {
  return api.postSessionlogin(input);
}

export async function logout() {
  return api.postSessionlogout({});
}

export function settingsHomeForSession(session: CurrentSession | undefined) {
  if (session?.capabilities.includes("viewSettingsOrganization")) return "/settings/organization";
  if (session?.capabilities.includes("viewSettingsUsers")) return "/settings/users";
  return "/deals";
}

export function canManageOrganizationSettings(session: CurrentSession | undefined) {
  return Boolean(session?.capabilities.includes("manageOrganizationSettings"));
}

export function canManageUsers(session: CurrentSession | undefined) {
  return Boolean(session?.capabilities.includes("managePermissions"));
}
