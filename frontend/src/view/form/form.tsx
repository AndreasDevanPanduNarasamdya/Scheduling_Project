import { useState, useEffect } from 'react';
import { registerLocale } from "react-datepicker";
import { id } from "date-fns/locale/id";
import { Calendar, Upload, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchWithToken, fetchStaffById, fetchTeams } from "../../api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAlert } from '../../view/messagebox/AlertProvider';


export default function Form() {
  const { showAlert } = useAlert();
  const [isTicketOn, setIsTicketOn] = useState(true);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { user } = useAuth();
  const [liveStaff, setLiveStaff] = useState<any>(null);
  const [teamName, setTeamName] = useState<string>("Memuat...");
  const minAllowedDate = new Date();
  minAllowedDate.setDate(minAllowedDate.getDate() + 14);

  const currentStaffId = user?.staffId || user?.staff?.staffId;

  const formatLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

    const staffId = user?.staffId || user?.staff?.staffId;

    if (!staffId) {
      showAlert({ 
        type: 'error', 
        title: 'Akses Ditolak', 
        message: 'Akun ini tidak memiliki Profil Staff yang terhubung di database. Anda tidak dapat mengirim tiket.' 
      });
      return;
    }

    if (!startDate || !endDate) {
      showAlert({ 
        type: 'warning', 
        title: 'Tanggal Belum Dipilih', 
        message: 'Harap pilih rentang tanggal mulai dan selesai!' 
      });
      return;
    }

    const ticketTypeValue = isTicketOn ? 0 : 1;

    const payload = {
      staffId: staffId,
      startDate: formatLocal(startDate), 
      endDate: formatLocal(endDate),
      type: ticketTypeValue, 
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
        showAlert({ 
          type: 'success', 
          title: 'Berhasil', 
          message: 'Tiket berhasil dikirim!' 
        });
        
        // Clear the form
        setTitle("");
        setDescription("");
        setDateRange([null, null]);
        setIsTicketOn(true);
      } else {
        showAlert({ 
          type: 'error', 
          title: 'Gagal Mengirim', 
          message: 'Gagal mengirim tiket. Silakan coba lagi.' 
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      showAlert({ 
        type: 'error', 
        title: 'Kesalahan Jaringan', 
        message: 'Tidak dapat terhubung ke server.' 
      });
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
                  minDate={minAllowedDate}
                    dateFormat="dd MMMM yyyy"
                    locale="id"
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
              className="btn-primary"
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