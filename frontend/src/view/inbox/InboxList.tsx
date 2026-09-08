import { useState, useEffect } from "react";
import { Mail, AlertCircle, Loader2, Calendar, X, Check } from "lucide-react";
import InboxSelected from "./InboxSelected";
import type { Ticket, TicketStatus } from "../../types";
import { fetchWithToken } from "../../api";
import { useAlert } from '../../view/messagebox/AlertProvider';

interface TicketCardProps {
  ticket: Ticket;
  onClick: (ticket: Ticket) => void;
}

function TicketCard({ ticket, onClick }: TicketCardProps) {
  const getStatusStyles = (status: TicketStatus) => {
    switch (status) {
      case "Pending":
        return { bar: "bg-amber-500", text: "text-amber-500", label: "Belum dibaca", icon: <AlertCircle size={15} /> };
      case "Approved":
        return { bar: "bg-green-500", text: "text-green-500", label: "Approved", icon: <Check size={15} /> };
      case "Declined":
        return { bar: "bg-red-500", text: "text-red-500", label: "Ditolak", icon: <X size={15} /> };
      default:
        return { bar: "bg-gray-300", text: "text-gray-500", label: "Unknown", icon: null };
    }
  };

  const statusStyle = getStatusStyles(ticket.status);

  return (
    <div 
      onClick={() => onClick(ticket)}
      // Increased width slightly to 340px to give the larger text room to breathe
      className="card !shadow-none hover:!shadow-md w-[340px] h-fit overflow-hidden cursor-pointer hover:-translate-y-1 transition-all border border-brand-outline flex flex-col shrink-0"
    >
      <div className={`w-full h-[8px] shrink-0 ${statusStyle.bar}`}></div>
      
      {/* Restored padding to a comfortable p-4 */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        
        <div>
          {/* THE STATUS HEADER */}
          <div className="flex justify-between items-center mb-3">
            <div className={`flex items-center gap-1.5 font-bold text-sm ${statusStyle.text}`}>
              {statusStyle.icon}
              <span>{statusStyle.label}</span>
            </div>
            <div className="text-black/30">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
              </svg>
            </div>
          </div>

          <div className="flex justify-between items-start mb-3">
            <div className="flex flex-col max-w-[75%] gap-0.5">
              <h3 className="text-left text-base font-bold text-black/90 leading-tight">
                {ticket.firstName} {ticket.lastName}
              </h3>
              <span className="text-left text-black/50 font-normal text-xs leading-tight">
                {ticket.role}
              </span>
              <p className="text-left ext-black/70 text-[13px] font-medium mt-0.5">
                {ticket.team}
              </p>
            </div>
            
            <span className={`badge shrink-0 mt-0.5 text-xs px-2.5 py-1 ${ticket.type === 'On' ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
              {ticket.type === 'On' ? 'ON' : 'OFF'}
            </span>
          </div>
          
          <div className="mb-3">
            <h4 className="font-bold text-black/90 text-sm text-left mb-1 truncate">{ticket.title}</h4>
            {/* Increased Description and Catatan to 13px with relaxed line height for readability */}
            <p className="text-black/60 text-[13px] text-left line-clamp-2 leading-relaxed">{ticket.description}</p>
            
            {ticket.status !== "Pending" && ticket.reason && (
              <div className="mt-3 border-t border-brand-outline/30 pt-3">
                <h4 className="text-black/90 text-[13px] font-semibold text-left mb-1">
                  Catatan:
                </h4>
                <p className="text-black/60 text-[13px] text-left line-clamp-1 leading-relaxed">{ticket.reason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Increased Footer text and icon size */}
        <div className="flex items-center gap-1.5 text-black/50 text-[12px] font-medium pt-3 mt-auto border-t border-brand-outline/30">
          <Calendar size={14} />
          {ticket.dateRange}
        </div>
      </div>
    </div>
  );
}

export default function InboxList() {
  const { showAlert } = useAlert(); // 🟢 Summon the hook
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        showAlert({ 
          type: 'error', 
          title: 'Gagal Memuat Inbox', 
          message: 'Tidak dapat mengambil daftar tiket dari server.' 
        });
      }
    } catch (error) {
      showAlert({ 
        type: 'error', 
        title: 'Kesalahan Jaringan', 
        message: 'Terjadi kesalahan saat menghubungi server.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const pendingCount = tickets.filter(t => t.status === "Pending").length;

  return (
    <div className="w-full min-h-screen bg-brand-bg overflow-y-auto font-sans flex flex-col">
      <div className="w-full max-w-[1600px] mx-auto px-6 md:px-10 lg:px-12 pt-10 md:pt-14 pb-16">
        
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold text-header-1">Inbox</h1>
          <Mail size={26} className="text-header-1" strokeWidth={2.5} />
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center shadow-sm">
              {pendingCount}
            </span>
          )}
        </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64 text-brand-primary">
          <Loader2 className="animate-spin" size={40} />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-black/40 italic text-sm py-12 text-center">Belum ada tiket masuk.</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,340px)] justify-center sm:justify-start gap-4 pb-4">
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
          fetchTickets();
        }}
      />

      </div>
    </div>
  );
}