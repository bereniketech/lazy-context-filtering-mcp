import type { SessionService } from "../session.js";

export async function sessionListResourceHandler(
  sessionService: SessionService
): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
  const sessions = await sessionService.listActiveSessions();
  return {
    contents: [
      {
        uri: "context://sessions",
        mimeType: "application/json",
        text: JSON.stringify(sessions)
      }
    ]
  };
}
