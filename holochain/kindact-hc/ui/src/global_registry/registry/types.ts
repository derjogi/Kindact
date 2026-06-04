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

export type KindactCoordinatorSignal = {
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
  | { type: "Cell"; cell: CellEntry }
  | { type: "Anchor"; anchor: AnchorEntry }
  | { type: "AnchorLink"; anchorLink: AnchorLinkEntry }
  | { type: "Subscription"; subscription: SubscriptionEntry }
  | { type: "JurisdictionalClaim"; claim: JurisdictionalClaimEntry };

/// Directory entry for a Kindact community cell (spec 050).
export interface CellEntry {
  name: string;
  role_name: string;
  network_seed: string;
  dna_hash: DnaHash;
  creator: AgentPubKey;
  status: string;
}

/// Wire format for `registry::register_cell`. The coordinator stamps
/// `creator` and `status` itself.
export interface RegisterCellInput {
  name: string;
  role_name: string;
  network_seed: string;
  dna_hash: DnaHash;
}

export interface AnchorEntry {
  name: string;
}

export interface AnchorLinkEntry {
  anchor_name: string;
  cell_role: string;
  cell_dna_hash: DnaHash;
  issue_id: ActionHash;
}

/// Wire format for `registry::publish_anchor_link`.
export interface PublishAnchorLinkInput {
  anchor_name: string;
  cell_role: string;
  cell_dna_hash: DnaHash;
  issue_id: ActionHash;
}

export interface SubscriptionEntry {
  anchor_name: string;
  subscriber: AgentPubKey;
}

export interface JurisdictionalClaimEntry {
  claim_id: string;
  scope_geographic: string[]; // e.g., ["h3:881f1d4895fffff"]
  topic_tags: string[];       // e.g., ["#housing"]
  decision_engine: string;    // e.g., "consensus_neighbor_agreement"
  verification_tier: string;  // e.g., "geotagged_evidence_required"
}
