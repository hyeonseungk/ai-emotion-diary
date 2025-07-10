"use client";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);

      if (!session) {
        router.push("/auth");
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        router.push("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setMessage(null);

    // 유효성 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage("모든 필드를 입력해 주세요.");
      setMessageType("error");
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("새 비밀번호가 일치하지 않습니다.");
      setMessageType("error");
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage("새 비밀번호는 최소 6자 이상이어야 합니다.");
      setMessageType("error");
      setPasswordLoading(false);
      return;
    }

    try {
      // 현재 비밀번호로 재인증
      if (!session?.user?.email) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("현재 비밀번호가 올바르지 않습니다.");
      }

      // 비밀번호 변경
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setMessage("비밀번호가 성공적으로 변경되었습니다.");
      setMessageType("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setMessage(
          (err as { message: string }).message || "오류가 발생했습니다."
        );
      } else {
        setMessage("오류가 발생했습니다.");
      }
      setMessageType("error");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-teal-50">
        <div className="text-rose-500 text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <Link
              href="/"
              className="text-rose-500 hover:text-rose-600 transition-colors"
            >
              ← 홈으로
            </Link>
            <h1 className="text-3xl font-bold text-rose-600">설정</h1>
            <div className="w-16"></div> {/* 공간 균형을 위한 빈 div */}
          </div>
        </header>

        <main className="max-w-2xl mx-auto">
          {/* 사용자 정보 */}
          <div className="bg-white/80 rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              계정 정보
            </h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">이메일:</span> {user.email}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">가입일:</span>{" "}
                {new Date(user.created_at).toLocaleDateString("ko-KR")}
              </p>
            </div>
          </div>

          {/* 비밀번호 변경 */}
          <div className="bg-white/80 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              비밀번호 변경
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-200 text-gray-900 placeholder-gray-500"
                  placeholder="현재 비밀번호를 입력하세요"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-200 text-gray-900 placeholder-gray-500"
                  placeholder="새 비밀번호를 입력하세요 (최소 6자)"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-200 text-gray-900 placeholder-gray-500"
                  placeholder="새 비밀번호를 다시 입력하세요"
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full bg-rose-400 hover:bg-rose-500 disabled:bg-rose-300 text-white font-semibold rounded-lg py-2 transition-colors"
              >
                {passwordLoading ? "변경 중..." : "비밀번호 변경"}
              </button>
            </form>

            {message && (
              <div
                className={`mt-4 p-3 rounded-lg text-sm ${
                  messageType === "success"
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-red-100 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}
          </div>

          {/* 기타 설정 */}
          <div className="bg-white/80 rounded-xl shadow-lg p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              계정 관리
            </h2>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  if (confirm("정말 로그아웃하시겠습니까?")) {
                    await supabase.auth.signOut();
                  }
                }}
                className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
