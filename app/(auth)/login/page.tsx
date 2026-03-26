// Login Screen (Mockup 4.1)
// Full-screen overlay with email/password form, BK-IRRIGATION logo, "Sign In" button
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sprout, Loader2 } from "lucide-react";
import { apiCall, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    document.title = "BK-IRRIGATION | Sign In";
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await apiCall<{ userId: string; email: string; adafruitUsername: string; adafruitKey: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      // Update auth context
      login(response);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
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

        {/* Error message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-sm">
            {error}
          </div>
        )}
        
        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-[#ddd] w-full p-2.5 text-sm outline-none focus:border-[#00695c] rounded-sm transition-colors" 
              placeholder="Email"
              required
              disabled={loading}
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
              disabled={loading}
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#00695c] text-white py-3 font-bold uppercase text-xs tracking-widest hover:brightness-110 transition-all rounded-sm shadow-sm mt-2 hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Register link */}
        <p className="text-center text-[11px] text-gray-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#00695c] font-bold hover:underline">
            Register
          </Link>
        </p>

      </div>
    </div>
  );
}