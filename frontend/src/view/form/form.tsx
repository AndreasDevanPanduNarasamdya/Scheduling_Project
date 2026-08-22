import { useState, useEffect } from 'react';
import { Calendar, Upload, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchWithToken, fetchStaffById, fetchTeams } from "../../api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


export default function Form() {
  const [isTicketOn, setIsTicketOn] = useState(true);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { user } = useAuth();
  const [liveStaff, setLiveStaff] = useState<any>(null);
  const [teamName, setTeamName] = useState<string>("Memuat...");

  const currentStaffId = user?.staffId || user?.staff?.staffId;

  useEffect(() => {
    const loadProfileAndTeam = async () => {
      const staffId = user?.staffId || user?.staff?.staffId;
      if (!staffId) {
        setTeamName("-");
        return;
      }

      // 1. Fetch Staff Profile
      try {
        const data = await fetchStaffById(staffId);
        setLiveStaff(data);
      } catch (err) {
        console.error("Failed to fetch live staff profile:", err);
      }

      // 2. 🔥 Fetch Teams to find out where this staff belongs
      try {
        const teams = await fetchTeams();
        const userTeam = teams.find((t: any) => t.members.some((m: any) => m.staffId === staffId));
        setTeamName(userTeam ? userTeam.teamName : "-");
      } catch (err) {
        console.error("Failed to fetch teams:", err);
        setTeamName("-");
      }
    };

    loadProfileAndTeam();
  }, [user?.staffId, user?.staff?.staffId]);

  const displayFirstName = liveStaff?.firstName ?? (user as any)?.firstName ?? user?.staff?.firstName ?? "";
  const displayLastName = liveStaff?.lastName ?? (user as any)?.lastName ?? user?.staff?.lastName ?? "";
  const displayPosition = liveStaff?.position ?? (user as any)?.position ?? user?.staff?.position ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔥 3. Grab the ID safely
    const staffId = user?.staffId || user?.staff?.staffId;

    if (!staffId) {
      alert("Error: Akun ini tidak memiliki Profil Staff yang terhubung di database. Anda tidak dapat mengirim tiket.");
      return;
    }

    if (!startDate || !endDate) {
      alert("Harap pilih rentang tanggal mulai dan selesai!");
      return;
    }

    const payload = {
      staffId: staffId,
      startDate: startDate.toISOString().split('T')[0], 
      endDate: endDate.toISOString().split('T')[0],
      type: isTicketOn ? "On" : "Off",
      title: title,
      description: description,
    };

    try {
      const response = await fetchWithToken(`http://localhost:5096/api/ticket/${staffId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Tiket berhasil dikirim!");
      } else {
        alert("Gagal mengirim tiket.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start pt-24 pb-16 px-6 bg-brand-bg overflow-y-auto">
      
      <div className="card p-8 w-[30vw] min-w-[450px]">
        <div className="ml-5 mr-5">
        
        <h2 className="text-[22px] font-semibold text-center mb-8">
          Pengajuan Tiket
        </h2>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          
          <div>
            <label className="form-label">Nama Lengkap</label>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={displayFirstName} 
                readOnly
                className="input-locked" 
              />
              <input 
                type="text" 
                value={displayLastName}
                readOnly
                className="input-locked" 
              />
            </div>
          </div>

          <div>
            <label className="form-label">Posisi</label>
            <input 
              type="text" 
              value={displayPosition}
              readOnly
              className="input-locked" 
            />
          </div>

          <div>
            <label className="form-label">Tim Shift</label>
            <input 
              type="text" 
              value={teamName} 
              readOnly 
              className="input-locked" 
            />
          </div>

          <div>
            <label className="form-label">Tipe Tiket</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTicketOn(false)}
                className={`btn-toggle ${!isTicketOn ? 'btn-active' : 'btn-inactive'}`}
              >
                OFF
              </button>
              
              <button
                type="button"
                onClick={() => setIsTicketOn(true)}
                className={`btn-toggle ${isTicketOn ? 'btn-active' : 'btn-inactive'}`}
              >
                ON
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">Tanggal Pengajuan</label>
            <div>
              <div className="relative w-full text-left"> 
                
                <DatePicker
                  selectsRange={true}
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(update) => setDateRange(update)}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Pilih rentang tanggal"
                  wrapperClassName="w-full" 
                  onKeyDown={(e) => e.preventDefault()}
                  className="input-field w-full pr-10 cursor-pointer"
                />
                
                <Calendar 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 pointer-events-none" 
                  size={18} 
                />
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Judul</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="input-field" 
            />
          </div>

          <div>
            <label className="form-label">Alasan Pengajuan</label>
            <textarea 
              rows={2} 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="input-field resize-y min-h-[60px]" 
            />
          </div>

          <div className="flex justify-end mt-4">
            <button 
              type="submit" 
              className="flex items-center gap-2 bg-brand-primary hover:bg-brand-dark text-white rounded-lg px-6 py-2.5 font-medium shadow-md transition-colors"
            >
              Kirim <Send size={18} />
            </button>
          </div>

        </form>
        </div>
      </div>
    </div>
  );
}