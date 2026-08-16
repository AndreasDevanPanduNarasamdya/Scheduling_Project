import { useState, useEffect } from 'react';
import { useAuth } from "../../context/AuthContext";
import { fetchWithToken } from "../../api";

export default function Dashboard() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [data, setData] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const fetchSecureData = async () => {
      try {
        const response = await fetchWithToken("http://localhost:5096/api/dashboard");
        
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    
    fetchSecureData();
    return () => clearInterval(timer);
  }, []);
    
  const day = currentTime.getDate();
  const month = currentTime.toLocaleString("default", { month: "long" });
  const year = currentTime.getFullYear();
  const hours = currentTime.getHours().toString().padStart(2, "0");
  const minutes = currentTime.getMinutes().toString().padStart(2, "0");
  const timeZone = currentTime.toLocaleTimeString("en-us", { timeZoneName: "short" }).split(" ")[2];
  const displayName = user?.staff?.firstName
    ? `${user.staff.firstName} ${user.staff.lastName ?? ""}`.trim()
    : user?.email ?? "Guest";
  const displayPosition = user?.staff?.position ?? "Team";
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
    <div className="p-8 pt-20 flex flex-col font-sans w-full bg-brand-bg">
      
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

      <div className="card mt-8 w-full flex-grow min-h-[50vh] p-8">
        
      </div>

    </div>
  );
}