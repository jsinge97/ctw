import type { CurrentSession, OrganizationSettingsDto } from "@ctw/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RadioTower, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { canManageOrganizationSettings } from "../../lib/api/adapters/session.js";
import { getOrganizationSettings, previewRoutingThreshold, updateOrganizationChannel, updateOrganizationSettings } from "../../lib/api/adapters/settings.js";

const channelModes = ["observe_only", "respond_when_addressed", "outbound_enabled", "passive", "active"] as const;

export function thresholdPreviewLabel(preview: { wouldEnterReview: number; wouldAutoRoute: number } | undefined) {
  if (!preview) return "Preview will update after the threshold loads.";
  return `${preview.wouldEnterReview} routed messages would enter review; ${preview.wouldAutoRoute} review items would auto-route.`;
}

export function OrganizationSettingsScreen({ session }: { session: CurrentSession | undefined }) {
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ["settings", "organization"], queryFn: getOrganizationSettings });
  const canManage = canManageOrganizationSettings(session);
  const [name, setName] = useState("");
  const [threshold, setThreshold] = useState(0.8);
  const preview = useQuery({
    queryKey: ["settings", "routing-preview", threshold],
    queryFn: () => previewRoutingThreshold(threshold),
    enabled: Number.isFinite(threshold) && threshold >= 0 && threshold <= 1
  });
  const invalidateSettings = async () => queryClient.invalidateQueries({ queryKey: ["settings", "organization"] });
  const updateSettings = useMutation({
    mutationFn: updateOrganizationSettings,
    onSuccess: async () => {
      toast.success("Organization settings saved");
      await invalidateSettings();
    },
    onError: () => toast.error("Could not save organization settings")
  });
  const updateChannel = useMutation({
    mutationFn: ({ channelId, mode, status }: { channelId: string; mode?: string; status?: string }) =>
      updateOrganizationChannel(channelId, {
        ...(mode !== undefined ? { mode } : {}),
        ...(status !== undefined ? { status } : {})
      }),
    onSuccess: async () => {
      toast.success("Channel settings saved");
      await invalidateSettings();
    },
    onError: () => toast.error("Could not save channel settings")
  });

  useEffect(() => {
    if (settings.data) {
      setName(settings.data.name);
      setThreshold(settings.data.routingConfidenceThreshold);
    }
  }, [settings.data]);

  return (
    <section className="settings-stack">
      <header className="crud-toolbar settings-toolbar">
        <div>
          <h2>Organization settings</h2>
          <p>Profile, routing threshold, and connected channel behavior.</p>
        </div>
        {canManage ? <Badge tone="green">Admin controls</Badge> : <Badge tone="amber">Read only</Badge>}
      </header>

      {settings.data ? (
        <>
          <form
            className="organization-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!canManage) return;
              updateSettings.mutate({ name: name.trim(), routingConfidenceThreshold: threshold });
            }}
          >
            <label>
              Organization name
              <input disabled={!canManage} value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              Routing confidence threshold
              <input disabled={!canManage} min="0" max="1" step="0.01" type="number" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} />
            </label>
            <div className="notice-panel">{thresholdPreviewLabel(preview.data)}</div>
            {canManage ? (
              <Button type="submit" variant="primary" isLoading={updateSettings.isPending} loadingLabel="Saving">
                <Save size={16} aria-hidden />
                Save organization
              </Button>
            ) : null}
          </form>

          <ChannelSettingsList
            canManage={canManage}
            settings={settings.data}
            onUpdate={(channelId, mode, status) =>
              updateChannel.mutate({
                channelId,
                ...(mode !== undefined ? { mode } : {}),
                ...(status !== undefined ? { status } : {})
              })
            }
            updatingChannelId={updateChannel.variables?.channelId}
            isUpdating={updateChannel.isPending}
          />
        </>
      ) : null}
      {settings.isError || preview.isError || updateSettings.isError || updateChannel.isError ? <p className="form-error">Organization settings change failed.</p> : null}
    </section>
  );
}

function ChannelSettingsList({
  canManage,
  isUpdating,
  onUpdate,
  settings,
  updatingChannelId
}: {
  canManage: boolean;
  isUpdating: boolean;
  onUpdate: (channelId: string, mode?: string, status?: string) => void;
  settings: OrganizationSettingsDto;
  updatingChannelId: string | undefined;
}) {
  return (
    <div className="channel-settings">
      {settings.channels.map((channel) => (
        <article className="channel-settings-row" key={channel.id}>
          <span className="crud-row-icon">
            <RadioTower size={16} aria-hidden />
          </span>
          <div>
            <strong>{channel.address}</strong>
            <span>{channel.provider} · {channel.type}</span>
          </div>
          <Badge tone={channel.status === "active" ? "green" : "amber"}>{channel.status}</Badge>
          {canManage ? (
            <>
              <select value={channel.mode} disabled={isUpdating && updatingChannelId === channel.id} onChange={(event) => onUpdate(channel.id, event.target.value)}>
                {channelModes.map((mode) => <option key={mode} value={mode}>{mode.replaceAll("_", " ")}</option>)}
              </select>
              <Button size="sm" variant="danger" isLoading={isUpdating && updatingChannelId === channel.id} onClick={() => onUpdate(channel.id, undefined, "archived")}>Disable</Button>
            </>
          ) : (
            <span>{channel.mode.replaceAll("_", " ")}</span>
          )}
        </article>
      ))}
    </div>
  );
}
