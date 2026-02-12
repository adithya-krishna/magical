import { db } from "../db";
import { notificationEvents, notifications } from "../db/schema";

type NotificationEventInput = {
  eventType: string;
  entityType: string;
  entityId?: string;
  payload?: Record<string, unknown>;
};

type NotificationInput = {
  recipientUserId: string;
  type: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  entityType: string;
  entityId?: string;
  ctaUrl?: string;
  metadata?: Record<string, unknown>;
};

export async function insertNotificationEvent(input: NotificationEventInput) {
  const result = await db
    .insert(notificationEvents)
    .values({
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: input.payload ?? {}
    })
    .returning();

  return result[0];
}

export async function insertNotifications(inputs: NotificationInput[]) {
  if (inputs.length === 0) {
    return [];
  }

  const result = await db.insert(notifications).values(inputs).returning();
  return result;
}
