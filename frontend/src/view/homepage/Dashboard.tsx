import { useState, useEffect, useMemo } from 'react';
import { useAuth } from "../../context/AuthContext";
import { fetchTimeline, fetchStaffById } from "../../api";
import TimelineComponent from "../scheduling/Timeline/components/TimelineComponent";
import type { TimelineTeam } from "../../types";

export default function Dashboard() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [teams, setTeams] = useState<TimelineTeam[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(true);

  const timelineStartDate = useMemo(() => new Date(new Date().getFullYear(), 0, 1), []);
  const timelineEndDate = useMemo(() => new Date(new Date().getFullYear() + 1, 11, 31), []);
  const [liveStaff, setLiveStaff] = useState<any>(null);

  useEffect(() => {
  const timer = setInterval(() => setCurrentTime(new Date()), 1000);

  const year = new Date().getFullYear();
  fetchTimeline(`${year}-01-01`, `${year + 1}-12-31`)
    .then((data) => setTeams(Array.isArray(data) ? data : []))
    .catch((err) => console.error("Failed to fetch timeline:", err))
    .finally(() => setIsTimelineLoading(false));
    
  if (user?.staff?.staffId) {
      fetchStaffById(user.staff.staffId)
        .then((data) => setLiveStaff(data))
        .catch((err) => console.error("Failed to fetch live staff profile:", err));
    }
    
  return () => clearInterval(timer);
}, []);
    
  const day = currentTime.getDate();
  const month = currentTime.toLocaleString("default", { month: "long" });
  const year = currentTime.getFullYear();
  const hours = currentTime.getHours().toString().padStart(2, "0");
  const minutes = currentTime.getMinutes().toString().padStart(2, "0");
  const timeZone = currentTime.toLocaleTimeString("en-us", { timeZoneName: "short" }).split(" ")[2];
  const firstName = liveStaff?.firstName ?? user?.staff?.firstName;
  const lastName = liveStaff?.lastName ?? user?.staff?.lastName ?? "";
  
  const displayName = firstName 
    ? `${firstName} ${lastName}`.trim() 
    : user?.email ?? "Guest";
    
  const displayPosition = liveStaff?.position ?? user?.staff?.position ?? "Team";
  const currentHour = currentTime.getHours();
  let greeting = "Welcome";
  
  if (currentHour >= 5 && currentHour < 12) {
    greeting = "Selamat Pagi";
  } else if (currentHour >= 12 && currentHour < 17) {
    greeting = "Selamat Siang";
  } else if (currentHour >= 17 && currentHour < 21) {
    greeting = "Selamat Sore";
  } else {
    greeting = "Selamat Malam";
  }
    
  return (
    <div className="p-8 pt-20 flex flex-col font-sans w-full flex-1 overflow-y-auto bg-brand-bg">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 w-full">
        
        <div className="flex flex-col mt-2 ml-10">
          <div className="flex items-baseline gap-3 mb-1">
            <h1 className="text-[39px] font-bold text-brand-dark tracking-tight">
              {greeting}, {displayName}!
            </h1>
          </div>
          
          <p className="text-4xl text-left ml-7 text-gray-700 font-medium">
            {displayPosition}
          </p>
        </div>

        <div className="card px-8 py-5 flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-gray-800 font-medium mb-1 text-left text-lg">Hari ini,</span>
            <div className="flex items-center gap-3">
              <span className="text-5xl md:text-6xl font-bold text-brand-primary leading-none">{day}</span>
              <div className="flex flex-col text-gray-900 font-medium leading-tight text-lg text-left">
                <span>{month}</span>
                <span>{year}</span>
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-6xl md:text-7xl font-bold text-brand-light tracking-tight leading-none">
              {hours}:{minutes}
            </span>
            <span className="text-gray-900 font-medium text-lg ml-1">{timeZone}</span>
          </div>
        </div>
      </div>

      <div className="card mt-8 w-full overflow-hidden flex flex-col mb-8 border-[#ABB3C1]">
        <TimelineComponent 
          teams={teams} 
          isLoading={isTimelineLoading} 
          startDate={timelineStartDate} 
          endDate={timelineEndDate} 
          compact 
        />
      </div>
    </div>
  );
}