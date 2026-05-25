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

import { IssueStatus } from "../../housing/housing/types";

export type WindTurbineSignal = {
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
  | { type: "Issue"; issue: IssueEntry }
  | { type: "Comment"; comment: CommentEntry };

export interface IssueEntry {
  title: string;
  description: string;
  status: IssueStatus;
}

export interface CommentEntry {
  issue_id: ActionHash;
  author: AgentPubKey;
  content: string;
}

export interface DiscoveryResult {
  anchor_name: string;
  issue_hashes: ActionHash[];
}
