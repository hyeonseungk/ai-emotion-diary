"use client";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    if (!email || !password) {
      setMessage("이메일과 비밀번호를 입력해 주세요.");
      setLoading(false);
      return;
    }
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("회원가입 성공! 이메일을 확인해 주세요.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage("로그인 성공!");
        window.location.href = "/";
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setMessage(
          (err as { message: string }).message || "오류가 발생했습니다."
        );
      } else {
        setMessage("오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-rose-100 to-teal-100 px-4">
      <div className="bg-white/80 rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-center text-rose-500 mb-2">
          감정일기
        </h1>
        <p className="text-center text-gray-600 mb-4">
          {isSignUp
            ? "오늘의 감정을 기록하며 나를 돌보는 첫걸음, 회원가입으로 시작해요."
            : "따뜻한 하루, 감정일기와 함께하세요. 로그인 후 일기를 작성해보세요."}
        </p>
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-200"
            autoComplete="email"
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-200"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
          />
          <button
            type="submit"
            className="bg-rose-400 hover:bg-rose-500 text-white font-semibold rounded py-2 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "처리 중..." : isSignUp ? "회원가입" : "로그인"}
          </button>
        </form>
        {message && (
          <div className="text-center text-sm text-rose-600 mt-2 min-h-[24px]">
            {message}
          </div>
        )}
        <button
          className="text-xs text-gray-500 hover:underline mt-2"
          onClick={() => {
            setIsSignUp((v) => !v);
            setMessage(null);
          }}
        >
          {isSignUp
            ? "이미 계정이 있으신가요? 로그인"
            : "처음이신가요? 회원가입"}
        </button>
      </div>
    </div>
  );
}
