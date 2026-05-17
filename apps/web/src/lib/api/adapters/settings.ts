import type {
  InviteUserRequest,
  OrganizationSettingsDto,
  RoutingThresholdPreviewDto,
  UpdateOrganizationChannelRequest,
  UpdateOrganizationSettingsRequest,
  UpdateUserRequest,
  UserDto
} from "@ctw/contracts";
import { api } from "../runtime.js";

export async function getOrganizationSettings(): Promise<OrganizationSettingsDto> {
  return api.getSettingsorganization();
}

export async function updateOrganizationSettings(body: UpdateOrganizationSettingsRequest): Promise<OrganizationSettingsDto> {
  return api.patchSettingsorganization(body);
}

export async function updateOrganizationChannel(channelId: string, body: UpdateOrganizationChannelRequest): Promise<OrganizationSettingsDto> {
  return api.patchSettingsorganizationChannelsChannelId({ channelId }, body);
}

export async function previewRoutingThreshold(threshold: number): Promise<RoutingThresholdPreviewDto> {
  return api.getSettingsorganizationRoutingPreviewThreshold({ threshold: String(threshold) });
}

export async function listUsers(): Promise<UserDto[]> {
  return api.getUsers();
}

export async function inviteUser(body: InviteUserRequest): Promise<UserDto> {
  return api.postUsers(body);
}

export async function updateUser(userId: string, body: UpdateUserRequest): Promise<UserDto> {
  return api.patchUsersuserId({ userId }, body);
}

export async function resendInvitation(userId: string): Promise<UserDto> {
  return api.postUsersuserIdResendInvitation({ userId });
}
