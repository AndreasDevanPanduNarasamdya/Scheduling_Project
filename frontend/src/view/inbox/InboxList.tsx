import { useState, useEffect } from "react";
import { Mail, AlertCircle, Loader2, Calendar, X, Check } from "lucide-react";
import InboxSelected from "./InboxSelected";
import type { Ticket, TicketStatus } from "../../types";
import { fetchWithToken } from "../../api";

interface TicketCardProps {
  ticket: Ticket;
  onClick: (ticket: Ticket) => void;
}

function TicketCard({ ticket, onClick }: TicketCardProps) {
const getStatusStyles = (status: TicketStatus) => {
    switch (status) {
      case "Pending":
        return { bg: "bg-amber-400", text: "text-amber-950", label: "Pending", icon: <AlertCircle size={16} /> };
      case "Approved":
        return { bg: "bg-emerald-500", text: "text-white", label: "Approved", icon: <Check size={16} /> };
      case "Declined":
        return { bg: "bg-red-500", text: "text-white", label: "Declined", icon: <X size={16} /> };
      default:
        return { bg: "bg-gray-300", text: "text-gray-700", label: "Unknown", icon: null };
    }
  };

  const statusStyle = getStatusStyles(ticket.status);

  return (
    <div 
      onClick={() => onClick(ticket)}
      className="bg-white w-[350px] rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.05)] overflow-hidden cursor-pointer hover:shadow-md transition-all border border-gray-100 flex flex-col shrink-0"
    >
      <div className={`${statusStyle.bg} ${statusStyle.text} px-4 py-2 flex justify-end items-center gap-2 font-bold text-xs tracking-wide`}>
        {statusStyle.label} {statusStyle.icon}
      </div>
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {ticket.firstName} {ticket.lastName} <span className="text-gray-500 font-normal ml-1 text-sm">{ticket.role}</span>
              </h3>
              <p className="text-gray-600 text-sm text-left font-medium">{ticket.team}</p>
            </div>
            <span className="bg-[#e8eff7] text-[#2a66b0] px-2.5 py-1 rounded-md text-xs font-bold">
              {ticket.type === 'On' ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="mb-4">
            <h4 className="font-bold text-gray-900 text-sm text-left mb-1">{ticket.title}</h4>
            <p className="text-gray-500 text-xs text-left line-clamp-2">{ticket.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-500 text-xs font-medium pt-2 border-t border-gray-50">
          <Calendar size={14} />
          {ticket.dateRange}
        </div>
      </div>
    </div>
  );
}

export default function InboxList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetchWithToken("http://localhost:5096/api/ticket", {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const rawData = await response.json();
          
          const formattedTickets = rawData.map((t: any) => {
            // 1. Translate the Status number to the exact word TypeScript wants
            let mappedStatus = "Pending";
            const rawStatus = t.status ?? t.Status;
            if (rawStatus === 0) mappedStatus = "Pending";
            if (rawStatus === 1) mappedStatus = "Approved";
            if (rawStatus === 2) mappedStatus = "Declined";

            // 2. Translate the Type number (1 for ON, anything else for OFF)
            let mappedType = "Off";
            const rawType = t.type ?? t.Type;
            if (rawType === 1 || rawType === "On" || rawType === "ON") mappedType = "On";

            return {
              ...t,
              ticketID: t.ticketID || t.TicketID,
              status: mappedStatus, // Use the translated word here!
              type: mappedType,     // Use the translated type here!
              dateRange: `${new Date(t.startDate || t.StartDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} - ${new Date(t.endDate || t.EndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
            };
          });

          setTickets(formattedTickets);
        } else {
          console.error("Gagal mengambil tiket dari server.");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const pendingCount = tickets.filter(t => t.status === "Pending").length;

  return (
    <div className="w-full p-8 font-sans flex flex-col">
      
      {/* HEADER AREA */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2.5">
          Inbox <Mail size={28} />
        </h1>
        <div className="flex items-center gap-1.5 text-amber-600 font-semibold text-sm bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
          {pendingCount} Pesan belum dibaca <AlertCircle size={16} />
        </div>
      </div>

      {/* HORIZONTAL SCROLLABLE 2-ROW GRID */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64 text-[#2a66b0]">
          <Loader2 className="animate-spin" size={40} />
        </div>
      ) : (
        <div 
          onWheel={(e) => {
            e.currentTarget.scrollLeft += e.deltaY;
          }}
          className="grid grid-flow-col grid-rows-2 overflow-x-auto pb-4 gap-5 w-full scrollbar-thin"
        >
          {tickets.map((ticket) => (
            <TicketCard 
              key={ticket.ticketID}
              ticket={ticket} 
              onClick={(t) => setSelectedTicket(t)} 
            />
          ))}
        </div>
      )}

      <InboxSelected 
        ticket={selectedTicket} 
        onClose={() => setSelectedTicket(null)}
        onActionComplete={() => {
          // Re-fetch your tickets or filter out the processed one here
          window.location.reload(); 
        }}
      />

    </div>
  );
}