import type { CurrentSession, UserDto } from "@ctw/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MailPlus, RotateCcw, Shield, UserRoundPlus } from "lucide-react";
import { useState } from "react";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { canManageUsers } from "../../lib/api/adapters/session.js";
import { inviteUser, listUsers, resendInvitation, updateUser } from "../../lib/api/adapters/settings.js";

const roles = ["admin", "am", "va", "broker", "client"] as const;

export function roleChangePreview(user: UserDto, nextRole: UserDto["role"]) {
  if (user.role === nextRole) return "No role change";
  return `${user.name} will move from ${user.role.toUpperCase()} to ${nextRole.toUpperCase()}`;
}

export function UsersSettingsScreen({ session }: { session: CurrentSession | undefined }) {
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: ["settings", "users"], queryFn: listUsers });
  const canManage = canManageUsers(session);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserDto["role"]>("broker");
  const invalidateUsers = async () => queryClient.invalidateQueries({ queryKey: ["settings", "users"] });
  const invite = useMutation({ mutationFn: inviteUser, onSuccess: invalidateUsers });
  const patchUser = useMutation({ mutationFn: ({ userId, body }: { userId: string; body: { role?: UserDto["role"]; status?: "active" | "disabled" } }) => updateUser(userId, body), onSuccess: invalidateUsers });
  const resend = useMutation({ mutationFn: resendInvitation, onSuccess: invalidateUsers });

  return (
    <section className="settings-stack">
      <header className="crud-toolbar settings-toolbar">
        <div>
          <h2>Users</h2>
          <p>Organization access, role assignment, and invitation state.</p>
        </div>
        {canManage ? <Badge tone="green">Admin controls</Badge> : <Badge tone="amber">AM view</Badge>}
      </header>

      {canManage ? (
        <form
          className="settings-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim() || !email.trim()) return;
            invite.mutate({ name: name.trim(), email: email.trim(), role });
            setName("");
            setEmail("");
          }}
        >
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" />
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" />
          <select value={role} onChange={(event) => setRole(event.target.value as UserDto["role"])}>
            {roles.map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}
          </select>
          <Button type="submit" variant="primary">
            <UserRoundPlus size={16} aria-hidden />
            Invite
          </Button>
        </form>
      ) : (
        <div className="notice-panel">
          AMs manage broker and client access from the Participants tab inside each deal. Organization roles are admin-only.
        </div>
      )}

      <div className="settings-table" role="table" aria-label="Organization users">
        {(users.data ?? []).map((user) => (
          <UserRow
            canManage={canManage}
            key={user.id}
            onResend={() => resend.mutate(user.id)}
            onUpdate={(body) => patchUser.mutate({ userId: user.id, body })}
            user={user}
          />
        ))}
      </div>
      {users.isError || invite.isError || patchUser.isError || resend.isError ? <p className="form-error">User change failed.</p> : null}
    </section>
  );
}

function UserRow({
  canManage,
  onResend,
  onUpdate,
  user
}: {
  canManage: boolean;
  onResend: () => void;
  onUpdate: (body: { role?: UserDto["role"]; status?: "active" | "disabled" }) => void;
  user: UserDto;
}) {
  const [nextRole, setNextRole] = useState<UserDto["role"]>(user.role);
  return (
    <article className="settings-user-row">
      <div>
        <strong>{user.name}</strong>
        <span>{user.email}</span>
      </div>
      <Badge tone={user.status === "active" ? "green" : user.status === "disabled" ? "red" : "amber"}>{user.status}</Badge>
      {canManage ? (
        <>
          <select value={nextRole} onChange={(event) => setNextRole(event.target.value as UserDto["role"])} aria-label={`Role for ${user.name}`}>
            {roles.map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}
          </select>
          <span className="settings-preview">
            <Shield size={14} aria-hidden />
            {roleChangePreview(user, nextRole)}
          </span>
          <div className="action-row settings-actions">
            <Button size="sm" onClick={() => onUpdate({ role: nextRole })}>Save role</Button>
            <Button size="sm" variant={user.status === "disabled" ? "secondary" : "danger"} onClick={() => onUpdate({ status: user.status === "disabled" ? "active" : "disabled" })}>
              {user.status === "disabled" ? "Reactivate" : "Disable"}
            </Button>
            {user.status === "invited" ? (
              <Button size="sm" onClick={onResend}>
                <MailPlus size={14} aria-hidden />
                Resend
              </Button>
            ) : null}
          </div>
        </>
      ) : (
        <span className="settings-preview">
          <RotateCcw size={14} aria-hidden />
          Last login {user.lastLoginAt ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(user.lastLoginAt)) : "not yet"}
        </span>
      )}
    </article>
  );
}
