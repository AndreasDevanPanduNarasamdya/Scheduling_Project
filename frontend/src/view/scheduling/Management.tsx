import { useState, useEffect } from "react";
import { ChevronDown, Menu, UserRound, Plus, ArrowLeftRight, Filter } from "lucide-react";
import type { Team } from "../../types";
import { fetchTeams } from "../../api"; 
import { createNewHire } from "../../api"; 

export default function ManagementPage() {
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    firstName: "",
    lastName: "",
    sex: "P", // Default to 'P' for Pria
    position: "",
    email: "",
    phone: "",
    dob: "",
    joinDate: ""
  });

  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsedTeams, setCollapsedTeams] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTeams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTeams(); // (Assuming this uses fetchWithToken now)
      setTeams(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  };

const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 1. Format the payload for the C# backend
      const payload = {
        firstName: staffForm.firstName,
        lastName: staffForm.lastName,
        sex: staffForm.sex === "P" ? 0 : 1, // Translating to your C# Enum
        position: staffForm.position,
        email: staffForm.email,
        phone: staffForm.phone,
        dob: staffForm.dob,
        joinDate: staffForm.joinDate
      };

      console.log("Sending to backend:", payload);

      // 2. Actually call the backend function!
      const result = await createNewHire(payload);
      
      console.log("Success! Staged New Hire token:", result.tokenId);
      alert(`Staff added to staging successfully! Token: ${result.tokenId}`);
      
      // 3. Reset form and close modal on success
      setIsAddStaffOpen(false);
      setStaffForm({ firstName: "", lastName: "", sex: "P", position: "", email: "", phone: "", dob: "", joinDate: "" });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to add new hire");
    } finally {
      setIsSubmitting(false);
    }
  };

useEffect(() => {
    loadTeams();
  }, []);

  const toggleTeam = (teamId: string) => {
    setCollapsedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#e8f1fc] font-sans">
      {/* Sidebar toggle button */}
      <button
        type="button"
        aria-label="Open menu"
        className="fixed top-0 left-0 m-0 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#4c3fd6] to-[#7b5ff0] text-white rounded-br-2xl shadow-md hover:brightness-110 transition"
      >
        <Menu size={22} />
      </button>

      <div className="max-w-5xl mx-auto px-8 pt-20 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-semibold text-gray-800">Management</h1>
          <UserRound size={22} className="text-gray-800 mt-1" strokeWidth={2.2} />
        </div>

        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <ActionButton 
            icon={<Plus size={15} />} 
            onClick={() => setIsAddStaffOpen(true)}
          >
            Tambah Anggota
          </ActionButton>
          <ActionButton icon={<Plus size={15} />}>Tambah Tim</ActionButton>
          <ActionButton icon={<Plus size={15} />}>Tambah Posisi</ActionButton>
          <ActionButton icon={<ArrowLeftRight size={15} />}>Ubah Anggota</ActionButton>
          <ActionButton icon={<Filter size={14} />} muted>
            Filter
          </ActionButton>
        </div>

        {/* Content states */}
        {isLoading && (
          <div className="text-gray-500 text-sm py-12 text-center">Loading teams…</div>
        )}

        {!isLoading && error && (
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-8 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {!isLoading && !error && teams.length === 0 && (
          <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-8 text-center text-sm text-gray-500">
            No teams yet. Use "Tambah Tim" to create one.
          </div>
        )}

        {!isLoading && !error && teams.length > 0 && (
          <div className="flex flex-col gap-8">
            {teams.map((team) => (
              <TeamSection
                key={team.teamId}
                team={team}
                collapsed={collapsedTeams.has(team.teamId)}
                onToggle={() => toggleTeam(team.teamId)}
              />
            ))}
          </div>
        )}
      </div>
      {/* Tambah Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-xl flex flex-col max-h-[95vh]">
            
            {/* Sticky Header */}
            <h2 className="text-xl font-medium text-center text-gray-800 p-6 pb-2 shrink-0">
              Tambah Staff
            </h2>
            
            <form onSubmit={handleAddStaffSubmit} className="flex flex-col min-h-0">
              
              {/* Scrollable Content Area */}
              <div className="overflow-y-auto px-6 py-2 space-y-3 text-left">
                
                {/* Nama Lengkap - Split inputs */}
                <div>
                  <label className="block text-sm mb-1 text-gray-800">Nama Lengkap</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      placeholder="Staf" 
                      className="w-full px-4 py-2 bg-[#f0f4fa] border border-[#d6e0f0] rounded-xl outline-none focus:border-[#6f92c9] text-sm"
                      value={staffForm.firstName}
                      onChange={e => setStaffForm({...staffForm, firstName: e.target.value})}
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="A" 
                      className="w-full px-4 py-2 bg-[#f0f4fa] border border-[#d6e0f0] rounded-xl outline-none focus:border-[#6f92c9] text-sm"
                      value={staffForm.lastName}
                      onChange={e => setStaffForm({...staffForm, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {/* Jenis Kelamin - Toggle Buttons */}
                <div>
                  <label className="block text-sm mb-1 text-gray-800">Jenis Kelamin</label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setStaffForm({...staffForm, sex: "P"})}
                      className={`w-11 h-9 rounded-lg text-sm font-semibold transition-colors
                        ${staffForm.sex === "P" ? "bg-[#3558a8] text-white" : "bg-white text-gray-700 border border-gray-300"}`}
                    >
                      P
                    </button>
                    <button 
                      type="button"
                      onClick={() => setStaffForm({...staffForm, sex: "W"})}
                      className={`w-11 h-9 rounded-lg text-sm font-semibold transition-colors
                        ${staffForm.sex === "W" ? "bg-[#3558a8] text-white" : "bg-white text-gray-700 border border-gray-300"}`}
                    >
                      W
                    </button>
                  </div>
                </div>

                {/* Posisi */}
                <div>
                  <label className="block text-sm mb-1 text-gray-800">Posisi</label>
                  <input 
                    type="text" 
                    placeholder="Senior Engineer" 
                    className="w-full px-4 py-2 bg-[#f0f4fa] border border-[#d6e0f0] rounded-xl outline-none focus:border-[#6f92c9] text-sm"
                    value={staffForm.position}
                    onChange={e => setStaffForm({...staffForm, position: e.target.value})}
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm mb-1 text-gray-800">Email</label>
                  <input 
                    type="email" 
                    placeholder="stafa@gmail.com" 
                    className="w-full px-4 py-2 bg-[#f0f4fa] border border-[#d6e0f0] rounded-xl outline-none focus:border-[#6f92c9] text-sm"
                    value={staffForm.email}
                    onChange={e => setStaffForm({...staffForm, email: e.target.value})}
                    required
                  />
                </div>

                {/* Nomor Telepon */}
                <div>
                  <label className="block text-sm mb-1 text-gray-800">Nomor Telepon</label>
                  <input 
                    type="tel" 
                    placeholder="+6281223551" 
                    className="w-full px-4 py-2 bg-[#f0f4fa] border border-[#d6e0f0] rounded-xl outline-none focus:border-[#6f92c9] text-sm"
                    value={staffForm.phone}
                    onChange={e => setStaffForm({...staffForm, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-800">Tanggal Lahir</label>
                  <input 
                    type="date" 
                    onClick={(e) => {
                      // Forces the browser calendar picker to open on click anywhere in the box
                      try {
                        (e.target as HTMLInputElement).showPicker();
                      } catch (err) {
                        // Fallback for browsers that don't support showPicker yet
                      }
                    }}
                    className="w-full px-4 py-2 bg-[#f0f4fa] border border-[#d6e0f0] rounded-xl outline-none focus:border-[#6f92c9] text-sm text-gray-700 cursor-pointer"
                    value={staffForm.dob}
                    onChange={e => setStaffForm({...staffForm, dob: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-800">Tanggal Bergabung</label>
                  <input 
                    type="date" 
                    onClick={(e) => {
                      try {
                        (e.target as HTMLInputElement).showPicker();
                      } catch (err) {}
                    }}
                    className="w-full px-4 py-2 bg-[#f0f4fa] border border-[#d6e0f0] rounded-xl outline-none focus:border-[#6f92c9] text-sm text-gray-700 cursor-pointer"
                    value={staffForm.joinDate}
                    onChange={e => setStaffForm({...staffForm, joinDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Sticky Actions */}
              <div className="flex justify-end gap-3 p-6 pt-4 shrink-0 bg-white rounded-b-[24px] border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-[#6f92c9] hover:bg-[#5a7ab0] text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
                >
                  {isSubmitting ? "Memproses..." : "Tambah Staff"}
                  {!isSubmitting && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  )}
                </button>
              </div>
              
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({ children, icon, muted = false, onClick }: { children: React.ReactNode; icon: React.ReactNode; muted?: boolean; onClick?: () => void; }) {
  return (
    <button
      type="button"
      onClick={onClick} // <-- THIS IS THE MISSING LINK!
      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition
        ${
          muted
            ? "bg-[#cfe0f4] text-gray-700 hover:bg-[#c0d6ee]"
            : "bg-[#6f92c9] text-white hover:bg-[#5f80b8]"
        }`}
    >
      {children}
      {icon}
    </button>
  );
}

function TeamSection({
  team,
  collapsed,
  onToggle,
}: {
  team: Team;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 mb-3 group"
      >
        <h2 className="text-xl font-bold text-gray-800">{team.teamName}</h2>
        <ChevronDown
          size={18}
          className={`text-gray-700 transition-transform ${collapsed ? "-rotate-90" : ""}`}
        />
      </button>

      {!collapsed && (
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="grid grid-cols-[1.2fr_1.2fr_0.8fr_2fr] px-6 pt-4 pb-2 text-sm text-gray-500 font-medium">
            <span>Nama</span>
            <span>Posisi</span>
            <span>Status</span>
            <span>Keterangan</span>
          </div>

          {team.members.length === 0 ? (
            <div className="px-6 py-6 text-sm text-gray-400">No members in this team yet.</div>
          ) : (
            team.members.map((member, i) => (
              <div
                key={member.staffId}
                className={`grid grid-cols-[1.2fr_1.2fr_0.8fr_2fr] items-center px-6 py-3 text-[15px] text-gray-800
                  ${i !== team.members.length - 1 ? "border-b border-[#eef2f8]" : ""}`}
              >
                <span>{member.name}</span>
                <span>{member.position}</span>
                <span>
                  <StatusBadge status={member.status} />
                </span>
                <span className="text-sm text-gray-500">{member.note ?? ""}</span>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: "ON" | "OFF" }) {
  const isOn = status === "ON";
  return (
    <span
      className={`inline-flex items-center justify-center w-14 py-1 rounded-md text-xs font-bold tracking-wide
        ${isOn ? "bg-[#2a66b0] text-white" : "bg-gray-200 text-gray-500"}`}
    >
      {status}
    </span>
  );
}