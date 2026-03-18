// Login Screen (Mockup 4.1)
// Full-screen overlay with email/password form, BK-IRRIGATION logo, "Sign In" button
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sprout } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  
  // Local state for form inputs
  const [email, setEmail] = useState("admin@hcmut.edu.vn");
  const [password, setPassword] = useState(".......");

  // Handle form submission
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // TODO: Add real authentication logic here
    console.log("Logging in with:", email);
    
    // Simulate successful login and redirect to the main dashboard
    router.push("/dashboard"); 
  };

  return (
    // Full screen background matching the sidebar color
    <div className="min-h-screen bg-[#004d40] flex items-center justify-center p-4 font-sans text-[#333]">
      
      {/* Login Card */}
      <div className="bg-white p-10 rounded-sm shadow-2xl w-full max-w-sm border-t-8 border-[#064e3b]">
        
        {/* Header & Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#00695c] p-3 rounded-sm text-white mb-4 shadow-md">
            <Sprout className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-700 tracking-tight">THINGSBOARD LOGIN</h1>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">
            BK-IRRIGATION PRO
          </p>
        </div>
        
        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-[#ddd] w-full p-2.5 text-sm outline-none focus:border-[#00695c] rounded-sm transition-colors" 
              placeholder="Email"
              required
            />
          </div>
          <div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-[#ddd] w-full p-2.5 text-sm outline-none focus:border-[#00695c] rounded-sm transition-colors" 
              placeholder="Password"
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-[#00695c] text-white py-3 font-bold uppercase text-xs tracking-widest hover:brightness-110 transition-all rounded-sm shadow-sm mt-2 hover:cursor-pointer"
          >
            Sign In
          </button>
        </form>

      </div>
    </div>
  );
}