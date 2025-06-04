"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

const Dashboard = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-black">
      {/* Navbar */}
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <span>👥</span>
          <span>SkillSwap</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-gray-600">
          <a href="#how" className="hover:text-black">How It Works</a>
          <a href="#skills" className="hover:text-black">Browse Skills</a>
          <a href="#pricing" className="hover:text-black">Pricing</a>
          <button className="ml-4 hover:text-black" onClick={() => router.push("/signin")}>
            Sign In
          </button>
          <button
            className="px-4 py-1 bg-black text-white rounded hover:opacity-90"
            onClick={() => router.push("/signup")}
          >
            Sign Up
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 px-8 py-16 items-center">
        <div>
          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            Share what you <br /> know, <br />
            <span className="text-gray-700">Learn what you don't</span>
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Exchange micro-learning sessions with peers. Teach your expertise,
            learn new skills, no money needed — just your time and knowledge.
          </p>
          <div className="flex gap-4">
            <button className="px-6 py-2 bg-black text-white rounded-md hover:opacity-90">
              Start Swapping
            </button>
            <button className="px-6 py-2 border border-gray-400 text-black rounded-md hover:bg-gray-100">
              How It Works
            </button>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            👤 Join 10,000+ users already swapping skills
          </p>
        </div>

       
        <div className="relative">
          <Image
            src="/video-call.jpg" 
            alt="Video Call"
            width={600}
            height={400}
            className="rounded-xl border shadow-lg"
          />
          <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow text-sm font-medium">
            📊 Excel Mastery <br />
            <span className="text-gray-500 text-xs">Taught by Bob</span>
          </div>
          <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded-lg shadow text-sm font-medium">
            🎬 Video Editing <br />
            <span className="text-gray-500 text-xs">Taught by Alice</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
