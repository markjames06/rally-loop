import type { FacilityRole } from "@/lib/auth/roles";

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
    };
    Enums: {
      facility_role: FacilityRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
