import type { ActivityLogAction } from "../../../../types";

export const ACTION_META: Record<ActivityLogAction, string> = {
  CreateStaff: "Menambah Akun Baru",
  EditStaff: "Mengedit Staff",
  RemoveStaff: "Menghapus Staff",
  AccountActivation: "Akun Teraktivasi",
  CreateTicket: "Membuat Tiket Baru",
  ApproveTicket: "Tiket Disetujui",
  DeclineTicket: "Tiket Ditolak",
  CreateTeam: "Membuat tim baru",
  EditTeam: "Mengedit Tim",
  RemoveTeam: "Menghapus Tim",
  CreatePersonalSchedule: "Membuat Jadwal Personal Baru",
  EditPersonalSchedule: "Mengedit Jadwal Personal",
  RemovePersonalSchedule: "Menghapus Jadwal Personal",
  CreateTeamSchedule: "Membuat Jadwal Tim Baru",
  EditTeamSchedule: "Mengedit Jadwal Tim",
  RemoveTeamSchedule: "Menghapus Jadwal Tim",
  SwitchingTeamMembers: "Menambahkan Staff ke Tim",
};

export function formatTimeOnly(timeString: string | undefined): string {
  if (!timeString) return "";
  return timeString.slice(0, 5);
}

export function formatDayHeader(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function getActionLabel(actionType: ActivityLogAction): string {
  return ACTION_META[actionType] || actionType;
}

export function getActualChanges(editString?: string): string[] {
  if (!editString) return [];
  return editString
    .split(";")
    .map((seg) => seg.trim())
    .filter(Boolean)
    .filter((seg) => {
      const arrowIdx = seg.indexOf("→");
      if (arrowIdx === -1) return true;
      const before = seg.slice(0, arrowIdx).split(":").slice(1).join(":").trim();
      const after = seg.slice(arrowIdx + 1).trim();
      return before !== after;
    });
}