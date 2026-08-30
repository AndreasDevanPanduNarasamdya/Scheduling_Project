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
  
  // 🔥 Changed back to 'bg' colors for the structural bar
  const getStatusStyles = (status: TicketStatus) => {
    switch (status) {
      case "Pending":
        return { bar: "bg-amber-500", text: "text-amber-500", label: "Belum dibaca", icon: <AlertCircle size={16} /> };
      case "Approved":
        return { bar: "bg-green-500", text: "text-green-500", label: "Approved", icon: <Check size={16} /> };
      case "Declined":
        return { bar: "bg-red-500", text: "text-red-500", label: "Ditolak", icon: <X size={16} /> };
      default:
        return { bar: "bg-gray-300", text: "text-gray-500", label: "Unknown", icon: null };
    }
  };

  const statusStyle = getStatusStyles(ticket.status);

  return (
    <div 
      onClick={() => onClick(ticket)}
      className="card !shadow-none hover:!shadow-md w-[350px] overflow-hidden cursor-pointer hover:-translate-y-1 transition-all border border-brand-outline flex flex-col shrink-0"
    >
      <div className={`w-full h-[17px] shrink-0 ${statusStyle.bar}`}></div>
      <div className="px-5 pb-5 pt-4 flex-1 flex flex-col justify-between">
        
        <div>
          {/* THE NEW STATUS HEADER */}
          <div className="flex justify-between items-center mb-4">
            <div className={`flex items-center gap-1.5 font-bold text-[13px] ${statusStyle.text}`}>
              {statusStyle.icon}
              <span>{statusStyle.label}</span>
            </div>
            {/* The 3-dots icon */}
            <div className="text-black/30">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
              </svg>
            </div>
          </div>

          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-base font-bold text-black/90">
                {ticket.firstName} {ticket.lastName} <span className="text-black/50 font-normal ml-1 text-sm">{ticket.role}</span>
              </h3>
              <p className="text-black/60 text-sm text-left font-medium">{ticket.team}</p>
            </div>
            
            <span className={`badge ${ticket.type === 'On' ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
              {ticket.type === 'On' ? 'ON' : 'OFF'}
            </span>
          </div>
          
          <div className="mb-4">
            <h4 className="font-bold text-black/90 text-sm text-left mb-1">{ticket.title}</h4>
            <p className="text-black/60 text-xs text-left line-clamp-2">{ticket.description}</p>
            
            {ticket.status !== "Pending" && ticket.reason && (
              <div className="mt-3 border-t border-brand-outline/30 pt-3">
                <h4 className="text-black/90 text-sm text-left mb-1">
                  Catatan:
                </h4>
                <p className="text-black/60 text-xs text-left line-clamp-2">{ticket.reason}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-black/50 text-xs font-medium pt-2 border-t border-brand-outline/30">
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
            return {
              ...t,
              ticketID: t.ticketID || t.TicketID,
              status: t.status || t.Status,  
              type: t.type || t.Type,          
              reason: t.reason || t.Reason,
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
    <div className="w-full h-full flex-1 p-8 font-sans flex flex-col">
      
      {/* HEADER AREA */}
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-brand-dark flex items-center gap-2.5">
          Inbox <Mail size={28} />
        </h1>
        <div className="flex items-center gap-1.5 text-amber-600 font-semibold text-sm bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
          {pendingCount} Pesan belum dibaca <AlertCircle size={16} />
        </div>
      </div>

      {/* HORIZONTAL SCROLLABLE GRID */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64 text-brand-primary">
          <Loader2 className="animate-spin" size={40} />
        </div>
      ) : (
        <div 
          onWheel={(e) => {
            e.currentTarget.scrollLeft += e.deltaY;
          }}
          className="flex-1 content-start grid grid-flow-col grid-rows-2 overflow-x-auto pt-4 pb-6 px-8 -mx-8 gap-5 scrollbar-thin"
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
          window.location.reload(); 
        }}
      />

    </div>
  );
}