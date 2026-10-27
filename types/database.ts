import type { FacilityRole } from "@/lib/auth/roles";

export type CourtStatus = "available" | "occupied" | "inactive";
export type SessionStatus =
  | "draft"
  | "open"
  | "paused"
  | "closed"
  | "completed";
export type QueuePolicy = "fifo";
export type QueueEntryStatus =
  | "waiting"
  | "assigned"
  | "withdrawn"
  | "skipped"
  | "played";
export type MatchStatus =
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          display_name?: string;
          avatar_url?: string | null;
          updated_at?: string;
        }
      >;
      facilities: Table<
        {
          id: string;
          name: string;
          slug: string;
          address: string | null;
          timezone: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          name: string;
          slug: string;
          address?: string | null;
          timezone: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          name?: string;
          slug?: string;
          address?: string | null;
          timezone?: string;
          updated_at?: string;
        }
      >;
      facility_members: Table<
        {
          id: string;
          facility_id: string;
          user_id: string;
          role: FacilityRole;
          created_at: string;
        },
        {
          id?: string;
          facility_id: string;
          user_id: string;
          role: FacilityRole;
          created_at?: string;
        },
        never
      >;
      sports: Table<
        {
          id: string;
          name: string;
          slug: string;
          is_active: boolean;
          created_at: string;
        },
        {
          id?: string;
          name: string;
          slug: string;
          is_active?: boolean;
          created_at?: string;
        },
        {
          name?: string;
          slug?: string;
          is_active?: boolean;
        }
      >;
      courts: Table<
        {
          id: string;
          facility_id: string;
          name: string;
          sport_id: string;
          status: CourtStatus;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          facility_id: string;
          name: string;
          sport_id: string;
          status?: CourtStatus;
          created_at?: string;
          updated_at?: string;
        },
        {
          name?: string;
          sport_id?: string;
          status?: CourtStatus;
          updated_at?: string;
        }
      >;
      sessions: Table<
        {
          id: string;
          facility_id: string;
          sport_id: string;
          name: string;
          starts_at: string;
          ends_at: string | null;
          status: SessionStatus;
          players_per_match: number;
          queue_policy: QueuePolicy;
          created_by: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          facility_id: string;
          sport_id: string;
          name: string;
          starts_at: string;
          ends_at?: string | null;
          status?: SessionStatus;
          players_per_match: number;
          queue_policy?: QueuePolicy;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          sport_id?: string;
          name?: string;
          starts_at?: string;
          ends_at?: string | null;
          status?: SessionStatus;
          players_per_match?: number;
          queue_policy?: QueuePolicy;
          updated_at?: string;
        }
      >;
      session_courts: Table<
        {
          session_id: string;
          court_id: string;
          facility_id: string;
          sport_id: string;
        },
        {
          session_id: string;
          court_id: string;
          facility_id: string;
          sport_id: string;
        },
        never
      >;
      queue_entries: Table<
        {
          id: string;
          session_id: string;
          player_id: string;
          status: QueueEntryStatus;
          joined_at: string;
          updated_at: string;
          handled_by: string | null;
          admin_note: string | null;
        },
        {
          id?: string;
          session_id: string;
          player_id: string;
          status?: QueueEntryStatus;
          joined_at?: string;
          updated_at?: string;
          handled_by?: string | null;
          admin_note?: string | null;
        },
        {
          status?: QueueEntryStatus;
          updated_at?: string;
          handled_by?: string | null;
          admin_note?: string | null;
        }
      >;
      matches: Table<
        {
          id: string;
          session_id: string;
          court_id: string;
          status: MatchStatus;
          assigned_at: string;
          started_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          created_by: string;
          notes: string | null;
          updated_at: string;
        },
        {
          id?: string;
          session_id: string;
          court_id: string;
          status?: MatchStatus;
          assigned_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          created_by: string;
          notes?: string | null;
          updated_at?: string;
        },
        {
          status?: MatchStatus;
          started_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          notes?: string | null;
          updated_at?: string;
        }
      >;
      match_players: Table<
        {
          match_id: string;
          session_id: string;
          player_id: string;
          queue_entry_id: string;
        },
        {
          match_id: string;
          session_id: string;
          player_id: string;
          queue_entry_id: string;
        },
        never
      >;
      audit_logs: Table<
        {
          id: string;
          facility_id: string;
          actor_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          details: Record<string, unknown>;
          created_at: string;
        },
        never,
        never
      >;
    };
    Views: Record<string, never>;
    Functions: {
      is_facility_member: {
        Args: {
          _facility_id: string;
          _roles: FacilityRole[];
        };
        Returns: boolean;
      };
      save_session: {
        Args: {
          _session_id: string | null;
          _facility_id: string;
          _sport_id: string;
          _name: string;
          _starts_at_local: string;
          _ends_at_local: string | null;
          _status: SessionStatus;
          _players_per_match: number;
          _queue_policy: QueuePolicy;
          _court_ids: string[];
        };
        Returns: string;
      };
      join_queue: {
        Args: { _session_id: string };
        Returns: string;
      };
      leave_queue: {
        Args: { _session_id: string };
        Returns: string;
      };
      get_session_queue: {
        Args: { _session_id: string };
        Returns: {
          entry_id: string;
          player_name: string;
          queue_position: number;
          joined_at: string;
          is_current_user: boolean;
        }[];
      };
      skip_queue_entry: {
        Args: {
          _session_id: string;
          _entry_id: string;
          _reason: string;
        };
        Returns: string;
      };
      assign_next_match: {
        Args: {
          _session_id: string;
          _court_id: string;
          _notes: string | null;
        };
        Returns: string;
      };
      start_match: {
        Args: {
          _session_id: string;
          _match_id: string;
        };
        Returns: string;
      };
      complete_match: {
        Args: {
          _session_id: string;
          _match_id: string;
          _notes: string | null;
        };
        Returns: string;
      };
      cancel_match: {
        Args: {
          _session_id: string;
          _match_id: string;
          _reason: string;
        };
        Returns: string;
      };
      get_session_matches: {
        Args: {
          _session_id: string;
        };
        Returns: {
          match_id: string;
          court_id: string;
          court_name: string;
          status: MatchStatus;
          assigned_at: string;
          started_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          notes: string | null;
          player_names: string[];
        }[];
      };
      get_my_match_history: {
        Args: Record<PropertyKey, never>;
        Returns: {
          match_id: string;
          session_id: string;
          session_name: string;
          facility_name: string;
          facility_timezone: string;
          court_name: string;
          status: MatchStatus;
          assigned_at: string;
          started_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          player_names: string[];
        }[];
      };
    };
    Enums: {
      facility_role: FacilityRole;
      court_status: CourtStatus;
      session_status: SessionStatus;
      queue_policy: QueuePolicy;
      queue_entry_status: QueueEntryStatus;
      match_status: MatchStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
