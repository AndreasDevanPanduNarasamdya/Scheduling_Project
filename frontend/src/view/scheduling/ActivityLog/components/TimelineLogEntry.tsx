import { User, Users, Calendar, Repeat } from "lucide-react";
import type { ActivityLogResponse } from "../../../../types";
import { formatTimeOnly, getActionLabel, getActualChanges } from "../utils/historyUtils";

interface TimelineLogEntryProps {
  log: ActivityLogResponse;
  isLast: boolean;
  isFirst: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function TimelineLogEntry({ log, isFirst, isLast, isCollapsed, onToggle }: TimelineLogEntryProps) {
  const action = log.action;
  const actionLabel = getActionLabel(action);

  const isTeamSchedule = ["CreateTeamSchedule", "EditTeamSchedule", "RemoveTeamSchedule"].includes(action);
  const isTeamBase = ["CreateTeam", "EditTeam", "RemoveTeam"].includes(action);
  const isTicket = ["CreateTicket", "ApproveTicket", "DeclineTicket"].includes(action);
  const isPersonalSchedule = ["CreatePersonalSchedule", "EditPersonalSchedule", "RemovePersonalSchedule"].includes(action);
  const isSwitch = action === "SwitchingTeamMembers";
  const isEditStaff = action === "EditStaff";

return (
    <div className={`relative pl-7 w-full ${isCollapsed ? 'pb-5' : 'pb-10'}`}>
      
      {/* Sibling Line (connecting blue dots directly to each other) */}
      {!isLast && (
        <div className="absolute left-[-1px] top-[14px] bottom-[-7px] w-[2px] bg-slate-400/80 z-0" />
      )}

      {/* THE MERGING TRUNK LOGIC */}
      {!isLast ? (
        // Middle items: Just draw a straight trunk line on the far left
        <div className={`absolute left-[-24px] ${isFirst ? 'top-[7px]' : 'top-0'} bottom-0 w-[2px] bg-slate-400/80 z-0`} />
      ) : (
        <>
          {/* Last item: Draw the trunk line stopping exactly where the bottom curve starts */}
          <div className={`absolute left-[-24px] ${isFirst ? 'top-[7px] h-[23px]' : 'top-0 h-[30px]'} w-[2px] bg-slate-400/80 z-0`} />
          {/* The magic merging bracket returning back to the trunk! */}
          <div className="absolute left-[-24px] top-[14px] w-[25px] h-[16px] border-r-[2px] border-b-[2px] border-slate-400/80 rounded-br-[12px] z-0" />
        </>
      )}

      {/* Blue Timeline Dot */}
      <button
        type="button"
        onClick={onToggle}
        // ... rest of the button stays the same
        title={isCollapsed ? "Tampilkan detail" : "Sembunyikan detail"}
        className="absolute left-[-7px] top-[0px] w-[14px] h-[14px] rounded-full bg-[#3b5998] ring-[4px] ring-[#f4f7fc] z-10 hover:scale-[1.15] transition-transform cursor-pointer"
      />

      {/* Content */}
      {isCollapsed ? (
        <div className="flex items-center h-[14px]">
          <span className="text-[16px] text-gray-500 font-semibold leading-none select-none cursor-pointer" onClick={onToggle}>
            {formatTimeOnly(log.time)}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-start text-left w-full mt-[-2px]">
          <span className="text-[16px] text-gray-500 font-semibold mb-1 leading-none">
            {formatTimeOnly(log.time)}
          </span>
          <span className="text-[18px] text-gray-900 font-semibold leading-snug mb-0.5">
            {log.actor}
          </span>
          <span className="text-[18px] text-gray-500 font-normal leading-snug mb-3">
            {actionLabel}
          </span>

          {/* Dynamic Fields */}
          <div className="flex flex-col items-start gap-2 mb-2">
            {isTicket && (
              <div className="font-bold text-black uppercase mb-0.5">
                {log.type === 1 ? "OFF" : "ON"}
              </div>
            )}

            {(isPersonalSchedule || isTeamSchedule || isTicket) && log.dateRange && (
              <div className="flex items-center gap-2 text-[14px] font-normal text-gray-600">
                <Calendar size={16} strokeWidth={2} className="text-gray-600" />
                {log.dateRange}
              </div>
            )}

            {(isPersonalSchedule || isTeamSchedule) && log.rotation && (
              <div className="flex items-center gap-2 text-[14px] font-normal text-gray-600">
                <Repeat size={16} strokeWidth={2} className="text-gray-600" />
                {log.rotation}
              </div>
            )}

            {isSwitch && log.rotation && (
              <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-700">
                <Users size={16} strokeWidth={2} className="text-gray-700" />
                {log.rotation}
              </div>
            )}

            {(isTeamBase || isTeamSchedule) ? (
              <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-700">
                <Users size={16} strokeWidth={2} className="text-gray-700" />
                {action === "EditTeam" && log.edit ? (getActualChanges(log.edit)[0] ?? log.target) : log.target}
              </div>
            ) : (
              log.target && (
                <div className="flex items-center gap-2 text-[14px] font-semibold text-gray-700">
                  <User size={16} strokeWidth={2} className="text-gray-700" />
                  {log.target}
                </div>
              )
            )}

            {isEditStaff && (() => {
              const changes = getActualChanges(log.edit);
              if (changes.length === 0) return null;
              return (
                <div className="flex flex-col gap-1 text-[13px] font-normal text-gray-600 leading-relaxed">
                  {changes.map((diff, i) => <div key={i}>{diff}</div>)}
                </div>
              );
            })()}
          </div>

          {log.description && (
            <div className="text-[13px] font-normal text-gray-400 mt-1 leading-snug text-left max-w-[280px] break-words">
              {log.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}