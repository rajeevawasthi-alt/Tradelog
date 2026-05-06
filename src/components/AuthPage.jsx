import { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { Input } from "./ui/FormControls";

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async () => {
    setErr("");
    if (!email || !pass) return setErr("Please fill all fields");
    if (mode === "signup" && (!name || pass !== confirmPass)) {
      if (!name) return setErr("Name is required");
      if (pass !== confirmPass) return setErr("Passwords do not match");
    }
    
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(res.user, { displayName: name });
        onLogin({ email, name, id: res.user.uid });
      } else {
        const res = await signInWithEmailAndPassword(auth, email, pass);
        onLogin({ email, name: res.user.displayName || "Trader", id: res.user.uid });
      }
    } catch (e) {
      console.error(e);
      setErr(e.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      onLogin({ email: res.user.email, name: res.user.displayName || "Trader", id: res.user.uid });
    } catch (e) {
      setErr(e.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090f] flex flex-col md:flex-row md:overflow-hidden relative font-sans overflow-y-auto">
      {/* Background elements */}
      <div className="absolute inset-0 grid-overlay pointer-events-none opacity-20" />
      <div className="absolute top-[10%] left-[5%] w-[30%] h-[30%] bg-[#00d4aa]/10 rounded-full blur-[120px] animate-orb pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-[30%] h-[30%] bg-[#f0c040]/10 rounded-full blur-[120px] animate-orb stagger-2 pointer-events-none" />
      <div className="absolute top-[40%] right-[15%] w-[20%] h-[20%] bg-[#00d4aa]/5 rounded-full blur-[100px] animate-orb stagger-3 pointer-events-none" />

      {/* LEFT PANEL - Hero Side */}
      <div className="flex-1 flex flex-col justify-center p-8 md:p-24 z-10 animate-in fade-in slide-in-from-left duration-1000">
        <div className="flex items-center gap-3 mb-16 stagger-1 animate-in fade-in slide-in-from-bottom duration-700 fill-mode-both">
          <div className="w-10 h-10 bg-[#00d4aa] rounded-lg flex items-center justify-center text-white shadow-[0_0_20px_rgba(0,212,170,0.4)]">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 9l-5 5-3-3-4 4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tighter text-white font-syne">TradeLog<span className="text-[#00d4aa]">.</span></h1>
        </div>

        <div className="space-y-6 max-w-xl">
          <p className="text-[#00d4aa] text-xs font-black tracking-[0.3em] uppercase stagger-2 animate-in fade-in slide-in-from-bottom duration-700 fill-mode-both">Master Your Edge</p>
          <h2 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] font-syne stagger-3 animate-in fade-in slide-in-from-bottom duration-700 fill-mode-both">
            The only journal you'll <span className="text-[#00d4aa]">actually use.</span>
          </h2>
          <p className="text-gray-400 text-lg md:text-xl font-medium leading-relaxed stagger-3 animate-in fade-in slide-in-from-bottom duration-1000 fill-mode-both">
            Track performance, analyze psychology, and scale your trading with precision data.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-8 stagger-3 animate-in fade-in duration-1000 delay-500 fill-mode-both">
            {["Psychology Tracking", "Advanced Analytics", "Risk Management"].map(p => (
              <span key={p} className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-gray-300">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 z-10 animate-in fade-in slide-in-from-right duration-1000">
        <div className="w-full max-w-md glass-card rounded-[2.5rem] p-10 relative overflow-hidden border-white/5">
          <div className="relative z-10">
            {/* Tabs */}
            <div className="flex gap-8 mb-12 border-b border-white/5 relative">
              {["login", "signup"].map(m => (
                <button 
                  key={m} 
                  onClick={() => { setMode(m); setErr(""); }}
                  className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${mode === m ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
                >
                  {m === "login" ? "Sign In" : "Register"}
                  {mode === m && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00d4aa] shadow-[0_0_10px_rgba(0,212,170,0.5)]" />}
                </button>
              ))}
            </div>

            <div className="mb-10">
              <h3 className="text-3xl font-extrabold text-white font-syne mb-2">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </h3>
              <p className="text-gray-500 text-sm font-medium">Please enter your credentials to access your edge.</p>
            </div>

            <div className="space-y-6">
              {mode === "signup" && (
                <Input 
                  label="Full Name" 
                  value={name} 
                  onChange={setName} 
                  placeholder="John Doe" 
                  icon={<span>👤</span>}
                />
              )}
              
              <Input 
                label="Email Address" 
                type="email" 
                value={email} 
                onChange={setEmail} 
                placeholder="trader@pro.com" 
                icon={<span>✉️</span>}
              />
              
              <div className="relative">
                <Input 
                  label={mode === "login" ? "Secret Key" : "Password"}
                  type={showPass ? "text" : "password"} 
                  value={pass} 
                  onChange={setPass} 
                  placeholder="••••••••••••" 
                  icon={<span>🔒</span>}
                />
                <button 
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-5 top-[26px] text-gray-500 hover:text-[#00d4aa] transition-colors"
                >
                  {showPass ? "👁️" : "🙈"}
                </button>
              </div>

              {mode === "signup" && (
                <Input 
                  label="Confirm Password" 
                  type="password" 
                  value={confirmPass} 
                  onChange={setConfirmPass} 
                  placeholder="••••••••••••" 
                  icon={<span>🔒</span>}
                />
              )}

              {err && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest py-3 px-4 rounded-xl text-center">
                  {err}
                </div>
              )}

              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="w-full btn-premium py-5 rounded-2xl uppercase tracking-[0.2em] text-sm shadow-2xl disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Processing</span>
                  </div>
                ) : (
                  mode === "login" ? "Initiate Terminal" : "Create Account"
                )}
              </button>

              {mode === "login" && (
                <>
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase">
                      <span className="bg-[#07090f] px-4 text-gray-600 font-black tracking-widest">or continue with</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={handleGoogleLogin}
                      className="flex-1 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-3"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Google
                    </button>
                    <button 
                      onClick={() => onLogin({ email: "demo@tradelog.pro", name: "Demo Trader", id: "demo" })}
                      className="flex-1 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all text-gray-400"
                    >
                      Demo Access
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
