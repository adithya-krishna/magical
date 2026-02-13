import { insertNotificationEvent, insertNotifications } from "./notification.repo";
import type { UserRole } from "../users/user.repo";
import { listUsersByRoles } from "../users/user.repo";

type NotifyRolesInput = {
  roles: UserRole[];
  type: string;
  title: string;
  body: string;
  severity?: "info" | "warning" | "critical";
  entityType: string;
  entityId?: string;
  ctaUrl?: string;
  metadata?: Record<string, unknown>;
};

type NotifyUsersInput = Omit<NotifyRolesInput, "roles"> & {
  userIds: string[];
};

export async function notifyRoles(input: NotifyRolesInput) {
  const recipients = (await listUsersByRoles(input.roles)) as Array<{ id: string }>;
  const severity = input.severity ?? "info";

  await insertNotificationEvent({
    eventType: input.type,
    entityType: input.entityType,
    entityId: input.entityId,
    payload: input.metadata
  });

  return insertNotifications(
    recipients.map((user) => ({
      recipientUserId: user.id,
      type: input.type,
      title: input.title,
      body: input.body,
      severity,
      entityType: input.entityType,
      entityId: input.entityId,
      ctaUrl: input.ctaUrl,
      metadata: input.metadata
    }))
  );
}

export async function notifyUsers(input: NotifyUsersInput) {
  const severity = input.severity ?? "info";

  await insertNotificationEvent({
    eventType: input.type,
    entityType: input.entityType,
    entityId: input.entityId,
    payload: input.metadata
  });

  return insertNotifications(
    input.userIds.map((userId) => ({
      recipientUserId: userId,
      type: input.type,
      title: input.title,
      body: input.body,
      severity,
      entityType: input.entityType,
      entityId: input.entityId,
      ctaUrl: input.ctaUrl,
      metadata: input.metadata
    }))
  );
}
