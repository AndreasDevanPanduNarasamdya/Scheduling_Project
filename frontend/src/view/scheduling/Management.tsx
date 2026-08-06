import { useState, useEffect } from "react";
import { ChevronDown, Menu, UserRound, Plus, ArrowLeftRight, Filter } from "lucide-react";
import type { Team } from "../../types";
import { fetchTeams } from "../../api"; 

export default function ManagementPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsedTeams, setCollapsedTeams] = useState<Set<string>>(new Set());

  const loadTeams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTeams(); // (Assuming this uses fetchWithToken now)
      setTeams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  };

useEffect(() => {
    loadTeams();
  }, []);

  const toggleTeam = (teamId: string) => {
    setCollapsedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#e8f1fc] font-sans">
      {/* Sidebar toggle button */}
      <button
        type="button"
        aria-label="Open menu"
        className="fixed top-0 left-0 m-0 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#4c3fd6] to-[#7b5ff0] text-white rounded-br-2xl shadow-md hover:brightness-110 transition"
      >
        <Menu size={22} />
      </button>

      <div className="max-w-5xl mx-auto px-8 pt-20 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-semibold text-gray-800">Management</h1>
          <UserRound size={22} className="text-gray-800 mt-1" strokeWidth={2.2} />
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <ActionButton icon={<Plus size={15} />}>Tambah Anggota</ActionButton>
          <ActionButton icon={<Plus size={15} />}>Tambah Tim</ActionButton>
          <ActionButton icon={<Plus size={15} />}>Tambah Posisi</ActionButton>
          <ActionButton icon={<ArrowLeftRight size={15} />}>Ubah Anggota</ActionButton>
          <ActionButton icon={<Filter size={14} />} muted>
            Filter
          </ActionButton>
        </div>

        {/* Content states */}
        {isLoading && (
          <div className="text-gray-500 text-sm py-12 text-center">Loading teams…</div>
        )}

        {!isLoading && error && (
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-8 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {!isLoading && !error && teams.length === 0 && (
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-8 text-center text-sm text-gray-500">
            No teams yet. Use "Tambah Tim" to create one.
          </div>
        )}

        {!isLoading && !error && teams.length > 0 && (
          <div className="flex flex-col gap-8">
            {teams.map((team) => (
              <TeamSection
                key={team.teamId}
                team={team}
                collapsed={collapsedTeams.has(team.teamId)}
                onToggle={() => toggleTeam(team.teamId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function ActionButton({
  children,
  icon,
  muted = false,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition
        ${
          muted
            ? "bg-[#cfe0f4] text-gray-700 hover:bg-[#c0d6ee]"
            : "bg-[#6f92c9] text-white hover:bg-[#5f80b8]"
        }`}
    >
      {children}
      {icon}
    </button>
  );
}

function TeamSection({
  team,
  collapsed,
  onToggle,
}: {
  team: Team;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 mb-3 group"
      >
        <h2 className="text-xl font-bold text-gray-800">{team.teamName}</h2>
        <ChevronDown
          size={18}
          className={`text-gray-700 transition-transform ${collapsed ? "-rotate-90" : ""}`}
        />
      </button>

      {!collapsed && (
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1.2fr_0.8fr_2fr] px-6 pt-4 pb-2 text-sm text-gray-500 font-medium">
            <span>Nama</span>
            <span>Posisi</span>
            <span>Status</span>
            <span>Keterangan</span>
          </div>

          {team.members.length === 0 ? (
            <div className="px-6 py-6 text-sm text-gray-400">No members in this team yet.</div>
          ) : (
            team.members.map((member, i) => (
              <div
                key={member.staffId}
                className={`grid grid-cols-[1.2fr_1.2fr_0.8fr_2fr] items-center px-6 py-3 text-[15px] text-gray-800
                  ${i !== team.members.length - 1 ? "border-b border-[#eef2f8]" : ""}`}
              >
                <span>{member.name}</span>
                <span>{member.position}</span>
                <span>
                  <StatusBadge status={member.status} />
                </span>
                <span className="text-sm text-gray-500">{member.note ?? ""}</span>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: "ON" | "OFF" }) {
  const isOn = status === "ON";
  return (
    <span
      className={`inline-flex items-center justify-center w-14 py-1 rounded-md text-xs font-bold tracking-wide
        ${isOn ? "bg-[#2a66b0] text-white" : "bg-gray-200 text-gray-500"}`}
    >
      {status}
    </span>
  );
}