export type queryTypes = "registerUser" | "uploadKey";

export interface RegisterUserQuery {
  callsign: string;
  password: string;
}

export interface RegisterUserReply {
  status: "created" | "alreadyExists";
}

export interface UploadKeyQuery {
  callsign: string;
  password: string;
  publicKey: string;
}

export interface UploadKeyReply {
  status: "uploaded" | "authError";
}
