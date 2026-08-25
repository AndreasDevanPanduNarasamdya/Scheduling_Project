import { useState, useEffect } from "react";
import type { Team, StaffMember } from "../../../../types";
import { fetchTeams, fetchUnassignedStaff, getUserClearance } from "../../../../api";
import { Clearance } from "../../../../types";

export function useManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [unassignedStaff, setUnassignedStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userClearance = getUserClearance();

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [teamsData, unassignedData] = await Promise.all([
        fetchTeams(),
        fetchUnassignedStaff()
      ]);
      setTeams(teamsData);
      setUnassignedStaff(unassignedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load management data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    teams,
    unassignedStaff,
    isLoading,
    error,
    userClearance,
    isAdmin: userClearance === Clearance.Admin,
    isStaff: userClearance === Clearance.Staff,
    loadData
  };
}