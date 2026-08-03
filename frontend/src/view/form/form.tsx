import { useState, useEffect } from 'react';
import { Calendar, Upload, Send } from 'lucide-react';



export default function Form() {
  const [isTicketOn, setIsTicketOn] = useState(true);

  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    position: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setTimeout(() => {
          setUserData({
            firstName: "Andreas", 
            lastName: "Devan",    
            position: "Senior Engineer"
          });
          setIsLoading(false);
        }, 1000);
        
      } catch (error) {
        console.error("Error fetching user data from DB:", error);
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

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

        <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
          
          <div>
            <label className={labelStyles}>Nama Lengkap</label>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={isLoading ? "Loading..." : userData.firstName} 
                readOnly
                className={lockedInputStyles} 
              />
              <input 
                type="text" 
                value={isLoading ? "Loading..." : userData.lastName}
                readOnly
                className={lockedInputStyles} 
              />
            </div>
          </div>

          <div>
            <label className={labelStyles}>Posisi</label>
            <input 
              type="text" 
              value={isLoading ? "Loading..." : userData.position}
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
            <input type="text" className={inputStyles} />
          </div>

          <div>
            <label className={labelStyles}>Alasan Pengajuan</label>
            <textarea 
              rows={2} 
              className={`${inputStyles} resize-y min-h-[60px]`} 
            />
          </div>

          <div>
            <label className={labelStyles}>Surat Pengajuan</label>
            <button 
              type="button" 
              className="flex items-center gap-2 bg-[#dadce0] hover:bg-[#d0d3d8] border border-gray-300 rounded shadow-sm px-4 py-2 text-sm font-medium text-gray-800 transition-colors"
            >
              Upload <Upload size={16} strokeWidth={2.5} />
            </button>
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