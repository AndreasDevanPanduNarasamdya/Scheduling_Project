
import React from "react";
import { useState, useEffect } from 'react';
import {
  PersonStanding,
  PlusCircle,
  ArrowLeftRight,
  ChevronDown,
} from "lucide-react";

export default function Management() {
  const [data, setData] = useState(null);

  const teams = [
    {
      name: "Tim A",
      members: [
        {
          name: "Staff A",
          position: "Junior Engineer",
          status: "ON",
          note: "",
        },
        {
          name: "Staff B",
          position: "Junior Engineer",
          status: "OFF",
          note: "Pengajuan untuk alasan kesehatan",
        },
        {
          name: "Staff C",
          position: "Junior Engineer",
          status: "ON",
          note: "",
        },
      ],
    },
    {
      name: "Tim B",
      members: [
        { name: "Staff D", position: "Leasing", status: "ON", note: "" },
        {
          name: "Staff E",
          position: "Leasing",
          status: "OFF",
          note: "Pengajuan untuk alasan istirahat",
        },
        { name: "Staff F", position: "Leasing", status: "ON", note: "" },
      ],
    },
    {
      name: "Tim C",
      members: [
        {
          name: "Staff G",
          position: "Senior Engineer",
          status: "ON",
          note: "",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#e8f2fc] p-8 font-sans text-gray-800">
      {/* Header Title */}
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-3xl font-medium text-black">Management</h1>
        <PersonStanding size={28} className="text-black mt-1" />
      </div>

      {/* Action Bar */}
      <div className="inline-flex items-center bg-[#7a9cc6] rounded-md text-white text-[13px] font-medium shadow-sm mb-10">
        <button className="flex items-center gap-1.5 px-4 py-2 hover:bg-[#688ab4] transition-colors border-r border-[#8eb1dd]">
          Tambah Anggota <PlusCircle size={15} />
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2 hover:bg-[#688ab4] transition-colors border-r border-[#8eb1dd]">
          Tambah Tim <PlusCircle size={15} />
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2 hover:bg-[#688ab4] transition-colors border-r border-[#8eb1dd]">
          Tambah Posisi <PlusCircle size={15} />
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2 hover:bg-[#688ab4] transition-colors border-r border-[#8eb1dd]">
          Ubah Anggota <ArrowLeftRight size={15} />
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2 hover:bg-[#688ab4] transition-colors">
          Filter <ChevronDown size={15} />
        </button>
      </div>

      {/* Team Lists */}
      <div className="flex flex-col gap-10">
        {teams.map((team, teamIndex) => (
          <div key={teamIndex} className="flex flex-col">
            {/* Team Header */}
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold text-black">{team.name}</h2>
              <ChevronDown
                size={20}
                className="text-black font-bold"
                strokeWidth={3}
              />
            </div>

            {/* Table Column Titles */}
            <div className="grid grid-cols-12 px-6 mb-2 text-[14px] text-gray-600 font-medium">
              <div className="col-span-3">Nama</div>
              <div className="col-span-3">Posisi</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-4">Keterangan</div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-xl shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden">
              {team.members.map((member, memberIndex) => (
                <div
                  key={memberIndex}
                  className={`grid grid-cols-12 items-center px-6 py-3.5 text-[15px] ${
                    memberIndex !== team.members.length - 1
                      ? "border-b border-gray-200"
                      : ""
                  }`}
                >
                  {/* Nama */}
                  <div className="col-span-3 text-gray-900 font-medium">
                    {member.name}
                  </div>

                  {/* Posisi */}
                  <div className="col-span-3 text-gray-600">
                    {member.position}
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <span
                      className={`px-3 py-1 rounded text-xs font-bold shadow-sm ${
                        member.status === "ON"
                          ? "bg-[#2a66b0] text-white"
                          : "bg-[#d5d5d5] text-gray-500"
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>

                  {/* Keterangan */}
                  <div className="col-span-4 text-gray-500 text-[13px]">
                    {member.note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
