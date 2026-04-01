import type { CreateSessionConfig, SessionService } from "../session.js";

type CreateSessionParams = {
  sessionService: SessionService;
  input?: CreateSessionConfig;
};

type EndSessionParams = {
  sessionService: SessionService;
  input: {
    sessionId: string;
  };
};

export async function createSessionTool(params: CreateSessionParams) {
  return params.sessionService.createSession(params.input);
}

export async function endSessionTool(params: EndSessionParams) {
  return params.sessionService.endSession(params.input.sessionId);
}

export type { CreateSessionParams, EndSessionParams };