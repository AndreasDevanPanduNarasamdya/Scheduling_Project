import type { 
  TimelineTeam, 
  Team, 
  CreateTimelinePayload, 
  TokenValidationResult,
  EndTimelinePayload,
  TimelineHistoryRecord
} from "./types";

const API_BASE_URL = "http://localhost:5096/api";

export const fetchWithToken = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("jwt_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    console.warn("Token expired or invalid. Logging out...");
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_info");
    window.location.href = "/"; 
    return response; 
  }

  return response;
};

export async function fetchTimeline(startDate: string, endDate: string): Promise<TimelineTeam[]> {
  const url = `${API_BASE_URL}/timeline?StartDate=${encodeURIComponent(startDate)}&EndDate=${encodeURIComponent(endDate)}`;
  const response = await fetchWithToken(url);
  
  if (!response.ok) {
    throw new Error("Failed to fetch timeline");
  }
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

export async function createTeam(payload: { teamName: string }) {
  const response = await fetchWithToken(`${API_BASE_URL}/teams`, {
    method: "POST",
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

export async function validateActivationToken(token: string): Promise<TokenValidationResult> {
  const response = await fetch(
    `${API_BASE_URL}/newhire/activate/validate?token=${encodeURIComponent(token)}`
  );
  if (!response.ok) {
    return { status: "invalid" };
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