import { useState, useEffect } from 'react';
import { Calendar, Upload, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';



export default function Form() {

  const [isTicketOn, setIsTicketOn] = useState(true);
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // console.log("My User Object looks like this:", user);

    const staffId = user?.staff?.staffId;

    if (!staffId) {
      alert("Error: User ID not found.");
      return;
    }

    const payload = {
      staffId: user?.staff?.staffId,
      date: date,
      type: isTicketOn ? "ON" : "OFF",
      title: title,
      description: description,
      document: "no-document-yet.pdf" // Placeholder until you do file uploads
    };

    try {
      const response = await fetch(`http://localhost:5096/api/tickets/${staffId}`, {
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

  const inputStyles = "w-full bg-[#eef3fa] border border-[#d2def0] rounded-md px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-[#23538a]/50 transition-all text-[15px]";
  const lockedInputStyles = "w-full bg-[#dbe4f0] border border-[#cbd6e6] rounded-md px-3 py-2 text-gray-500 cursor-not-allowed outline-none text-[15px] select-none";
  const labelStyles = "block text-[15px] font-medium text-gray-900 mb-1.5 text-left";

  return (
    <div className="min-h-screen bg-[#e8f2fc] flex items-center justify-center p-6 font-sans">
      
      <div className="bg-white rounded-[24px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] p-8 w-[30vw] min-w-[450px]">
        <div className="ml-5 mr-5">
        
        <h2 className="text-[22px] font-semibold text-center text-black mb-8">
          Pengajuan Tiket
        </h2>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          
          <div>
            <label className={labelStyles}>Nama Lengkap</label>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={user?.staff?.firstName ?? ""} 
                readOnly
                className={lockedInputStyles} 
              />
              <input 
                type="text" 
                value={user?.staff?.lastName ?? ""}
                readOnly
                className={lockedInputStyles} 
              />
            </div>
          </div>

          <div>
            <label className={labelStyles}>Posisi</label>
            <input 
              type="text" 
              value={user?.staff?.position ?? ""}
              readOnly
              className={lockedInputStyles} 
            />
          </div>

          <div>
            <label className={labelStyles}>Tim Shift</label>
            <input type="text" defaultValue="Tim A" className={inputStyles} />
          </div>

          <div>
            <label className={labelStyles}>Tipe Tiket</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTicketOn(false)}
                className={`px-3 py-1 rounded text-xs font-bold shadow-sm transition-colors ${
                  !isTicketOn 
                    ? 'bg-gray-300 text-gray-600' 
                    : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                }`}
              >
                OFF
              </button>
              <button
                type="button"
                onClick={() => setIsTicketOn(true)}
                className={`px-3 py-1 rounded text-xs font-bold shadow-sm transition-colors ${
                  isTicketOn 
                    ? 'bg-[#2a66b0] text-white' 
                    : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                }`}
              >
                ON
              </button>
            </div>
          </div>

          <div>
            <label className={labelStyles}>Tanggal</label>
            <div className="relative">
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                // showPicker() forces the calendar to open when you click anywhere on the input
                onClick={(e) => e.currentTarget.showPicker()} 
                // Hides the default browser calendar icon
                className={`${inputStyles} pr-10 [&::-webkit-calendar-picker-indicator]:hidden cursor-pointer`} 
              />
              {/* pointer-events-none ensures clicking the icon passes through to the input beneath it */}
              <Calendar className="absolute right-3 top-[10px] text-gray-600 pointer-events-none" size={18} />
            </div>
          </div>

          <div>
            <label className={labelStyles}>Judul</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputStyles} 
            />
          </div>

          <div>
            <label className={labelStyles}>Alasan Pengajuan</label>
            <textarea 
              rows={2} 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className={`${inputStyles} resize-y min-h-[60px]`} 
            />
          </div>

          <div className="flex justify-end mt-4">
            <button 
              type="submit" 
              className="flex items-center gap-2 bg-[#2a66b0] hover:bg-[#1e549a] text-white rounded-md px-5 py-2 font-medium shadow-md transition-colors"
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