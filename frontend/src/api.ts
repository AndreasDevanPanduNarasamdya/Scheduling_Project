import type { Team } from "./types"; // Adjust the path if your types file is somewhere else

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

export async function fetchTeams(): Promise<Team[]> {
  const response = await fetchWithToken("http://localhost:5096/api/teams");
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

export async function createNewHire(payload: any) {
  const response = await fetchWithToken("http://localhost:5096/api/newhire/new-hire", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to add new hire");
  }

  return response.json();
}

export async function activateAccount(token: string, password: string) {
  const response = await fetch("http://localhost:5096/api/newhire/activate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, password }),
  });

  if (!response.ok) {
    throw new Error("Failed to activate account");
  }

  return response.json();
}