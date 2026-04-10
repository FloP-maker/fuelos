import localforage from "localforage";
import type { IntakeAction } from "@/types/race-session";

const STORE = localforage.createInstance({
  name: "fuelos",
  storeName: "intake_actions",
});

const keyForSession = (sessionId: string) => `intake_buffer:${sessionId}`;

export async function readOfflineBuffer(sessionId: string): Promise<IntakeAction[]> {
  const raw = await STORE.getItem<unknown>(keyForSession(sessionId));
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x) =>
      x &&
      typeof x === "object" &&
      typeof (x as IntakeAction).intakeId === "string" &&
      typeof (x as IntakeAction).action === "string" &&
      typeof (x as IntakeAction).synced === "boolean"
  ) as IntakeAction[];
}

export async function appendOfflineAction(sessionId: string, action: IntakeAction): Promise<void> {
  const cur = await readOfflineBuffer(sessionId);
  cur.push(action);
  await STORE.setItem(keyForSession(sessionId), cur);
}

export async function replaceOfflineBuffer(sessionId: string, actions: IntakeAction[]): Promise<void> {
  await STORE.setItem(keyForSession(sessionId), actions);
}

export async function clearOfflineBuffer(sessionId: string): Promise<void> {
  await STORE.removeItem(keyForSession(sessionId));
}
