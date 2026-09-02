import { ChevronDown } from "lucide-react";
import type { Team, StaffMember } from "../../../../types";

interface TeamSectionProps {
  team: Team;
  collapsed: boolean;
  onToggle: () => void;
  isUnassigned?: boolean;
  onStaffClick: (staff: StaffMember) => void;
}

export function StatusBadge({ status }: { status: "ON" | "OFF" | "TRANSITION" | "LEAVE" }) {
  const styles: Record<string, string> = {
    ON: "bg-brand-primary text-white",
    OFF: "bg-gray-200 text-gray-600",
    TRANSITION: "bg-yellow-400 text-yellow-900",
    LEAVE: "bg-red-500 text-white",
  };
  const labels: Record<string, string> = {
    ON: "ON",
    OFF: "OFF",
    TRANSITION: "TRANSISI",
    LEAVE: "IZIN",
  };
  return (
    <span className={`badge ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function TeamSection({ team, collapsed, onToggle, isUnassigned = false, onStaffClick }: TeamSectionProps) {
  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 mb-3 group cursor-pointer"
      >
        <h2 className={`text-xl font-bold ${isUnassigned ? "text-black/50" : "text-brand-dark"}`}>
          {team.teamName}
        </h2>
        <ChevronDown size={18} className={`text-black/70 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-[1.2fr_1.2fr_0.8fr_2fr] px-6 pt-2 pb-1 text-sm text-black/50 font-medium">
            <span>Nama</span>
            <span>Posisi</span>
            <span>Status</span>
            <span>Keterangan</span>
          </div>

          {team.members.length === 0 ? (
            <div className="card px-6 py-6 text-sm text-black/40">Belum ada anggota di tim ini.</div>
          ) : (
            <div className="card overflow-hidden">
              {team.members.map((member, i) => (
                <div
                  key={member.staffId}
                  onClick={() => onStaffClick(member)}
                  className={`cursor-pointer grid grid-cols-[1.2fr_1.2fr_0.8fr_2fr] items-center px-6 py-4 text-[15px] text-black/90 hover:bg-brand-bg/80 transition-colors ${
                    i !== team.members.length - 1 ? "border-b border-brand-outline/40" : ""
                  }`}
                >
                  <span className="font-medium text-brand-primary">{member.name}</span>
                  <span className="text-black/70">{member.position}</span>
                  <span><StatusBadge status={member.status as "ON" | "OFF" | "TRANSITION" | "LEAVE"} /></span>
                  <span className="text-sm text-black/50 truncate pr-4">{member.note ?? ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}