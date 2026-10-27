import type { FacilityRole } from "@/lib/auth/roles";

export type CourtStatus = "available" | "occupied" | "inactive";
export type SessionStatus =
  | "draft"
  | "open"
  | "paused"
  | "closed"
  | "completed";
export type QueuePolicy = "fifo";

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
    };
    Enums: {
      facility_role: FacilityRole;
      court_status: CourtStatus;
      session_status: SessionStatus;
      queue_policy: QueuePolicy;
    };
    CompositeTypes: Record<string, never>;
  };
};
