import {
  ActionHash,
  AgentPubKey,
  Create,
  CreateLink,
  Delete,
  DeleteLink,
  DnaHash,
  EntryHash,
  Record,
  SignedActionHashed,
  Update,
} from "@holochain/client";

export type IssueStatus =
  | "Draft"
  | "Deliberating"
  | "VoteReady"
  | "Adopted"
  | "Implementing"
  | "Completed"
  | "Archived"
  | "Challenged";

export type HousingSignal = {
  type: "EntryCreated";
  action: SignedActionHashed<Create>;
  app_entry: EntryTypes;
} | {
  type: "EntryUpdated";
  action: SignedActionHashed<Update>;
  app_entry: EntryTypes;
  original_app_entry: EntryTypes;
} | {
  type: "EntryDeleted";
  action: SignedActionHashed<Delete>;
  original_app_entry: EntryTypes;
} | {
  type: "LinkCreated";
  action: SignedActionHashed<CreateLink>;
  link_type: string;
} | {
  type: "LinkDeleted";
  action: SignedActionHashed<DeleteLink>;
  link_type: string;
};

export type EntryTypes =
  | { type: "Issue"; issue: HousingIssue }
  | { type: "Challenge"; challenge: BindingChallenge };

export interface HousingIssue {
  title: string;
  location: string;
  status: IssueStatus;
  has_geotagged_evidence: boolean;
}

export interface BindingChallenge {
  issue_hash: ActionHash;
  reason: string;
}
