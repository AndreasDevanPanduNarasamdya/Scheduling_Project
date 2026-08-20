import type { 
  TimelineTeam, 
  Team, 
  CreateTimelinePayload, 
  TokenValidationResult,
  EndTimelinePayload,
  TimelineHistoryRecord,
  ActivityLogResponse,
  UpdateStaffPayload
} from "./types";

const API_BASE_URL = "http://localhost:5096/api";

export async function fetchWithToken(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    'Authorization': `Bearer ${token}` 
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user_info");
    window.location.href = "/";
    throw new Error("Session expired. Please log in again.");
  }

  return response;
}

export async function fetchTimeline(startDate: string, endDate: string) {
  //FIXED: Now uses API_BASE_URL instead of hardcoding localhost
  const response = await fetchWithToken(`${API_BASE_URL}/timeline?start=${startDate}&end=${endDate}`);
  
  if (!response.ok) throw new Error("Failed to fetch timeline");
  return response.json();
}

export async function createTimeline(payload: CreateTimelinePayload): Promise<void> {
  const response = await fetchWithToken(`${API_BASE_URL}/timeline`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Gagal menyimpan jadwal");
  }
}

export async function fetchTeams(): Promise<Team[]> {
  const response = await fetchWithToken(`${API_BASE_URL}/teams`);
  if (!response.ok) throw new Error("Failed to load teams");
  
  const rawData = await response.json();
  return rawData.map((t: any) => ({
    teamId: t.teamId || t.TeamId,
    teamName: t.teamName || t.TeamName,
    members: (t.members || t.Members || []).map((m: any) => ({
      staffId: m.staffId || m.StaffId,
      name: m.name || m.Name,
      position: m.position || m.Position,
      status: m.status || m.Status,
      note: m.note ?? m.Note ?? null
    }))
  }));
}

export async function fetchUnassignedStaff() {
  const response = await fetchWithToken(`${API_BASE_URL}/staff/unassigned`);
  if (!response.ok) throw new Error("Failed to fetch unassigned staff");
  return response.json();
}

export async function createTeam(payload: any) {
  const response = await fetchWithToken(`${API_BASE_URL}/teams`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) throw new Error("Failed to create team");
  return response.json();
}

export async function assignStaffToTeam(staffId: string, teamId: string) {
  const response = await fetchWithToken(`${API_BASE_URL}/staff/assign`, {
    method: "POST",
    body: JSON.stringify({ staffId, teamId })
  });
  if (!response.ok) throw new Error("Failed to assign staff");
  return response.json();
}

export async function createNewHire(payload: any) {
  const response = await fetchWithToken(`${API_BASE_URL}/newhire/new-hire`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to add new hire");
  }
  return response.json();
}

export async function validateActivationToken(token: string): Promise<{ status: any; name?: string }> {
  const response = await fetch(`${API_BASE_URL}/newhire/activate/validate?token=${encodeURIComponent(token)}`);
  
  if (!response.ok) {
    throw new Error("Failed to validate token");
  }

  return response.json();
}

export async function activateAccount(token: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/newhire/activate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to activate account");
  }
  return response.json();
}

export async function fetchTimelineHistory(teamId?: string, staffId?: string): Promise<TimelineHistoryRecord[]> {
  const params = new URLSearchParams();
  if (teamId) params.append("teamId", teamId);
  if (staffId) params.append("staffId", staffId);

  const url = `${API_BASE_URL}/timeline/history?${params.toString()}`;
  const response = await fetchWithToken(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to fetch timeline history");
  }

  return response.json();
}

export async function endActiveTimeline(payload: EndTimelinePayload): Promise<void> {
  const response = await fetchWithToken(`${API_BASE_URL}/timeline/end`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Gagal mengakhiri jadwal aktif");
  }
}

export async function deleteStaff(staffId: string) {
  const response = await fetchWithToken(`${API_BASE_URL}/staff/${staffId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete staff");
  return response.json();
}

export async function deleteTeam(teamId: string) {
  const response = await fetchWithToken(`${API_BASE_URL}/teams/${teamId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete team");
  return response.json();
}

export async function fetchActivityLogs(params: {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  staffId?: string;
  teamId?: string;
} = {}): Promise<ActivityLogResponse[]> {
  const query = new URLSearchParams();
  if (params.startDate) query.append("startDate", params.startDate);
  if (params.endDate) query.append("endDate", params.endDate);
  if (params.staffId) query.append("staffId", params.staffId);
  if (params.teamId) query.append("teamId", params.teamId);

  const response = await fetchWithToken(`${API_BASE_URL}/activitylog?${query.toString()}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to fetch activity log");
  }

  return response.json();
}

export async function editStaff(staffId: string, payload: UpdateStaffPayload) {
  const response = await fetchWithToken(`${API_BASE_URL}/staff/${staffId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // Try to catch the JSON error message from the backend, fallback to text if it fails
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Gagal memperbarui staff");
  }
  
  return response.json();
}

export async function fetchStaffById(staffId: string) {
  const response = await fetchWithToken(`${API_BASE_URL}/staff/${staffId}`);
  if (!response.ok) throw new Error("Failed to fetch staff details");
  return response.json();
}

export async function editTeam(teamId: string, payload: { teamName: string }) {
  const response = await fetchWithToken(`${API_BASE_URL}/teams/${teamId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Gagal memperbarui nama tim");
  }
  
  return response.json();
}

export async function updateTimeline(
  timelineId: string,
  payload: { daysOn: number; daysOff: number; startDate: string; endDate?: string | null }
): Promise<void> {
  const response = await fetchWithToken(`${API_BASE_URL}/timeline/${timelineId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Gagal memperbarui jadwal");
  }
}

export async function deleteTimelineSchedule(timelineId: string): Promise<void> {
  const response = await fetchWithToken(`${API_BASE_URL}/timeline/${timelineId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Gagal menghapus jadwal");
  }
}