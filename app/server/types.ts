export type queryTypes = "registerUser";

export type registerStatus = "created" | "alreadyExists" | "error";

export interface RegisterUserQuery {
  callsign: string;
  password: string;
}

export interface RegisterUserReply {
  status: registerStatus;
  error?: string | undefined;
}
