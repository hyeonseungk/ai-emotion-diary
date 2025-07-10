"use client";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewDiaryPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setMessage("일기 내용을 입력해 주세요.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // 현재 사용자 세션 확인
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("로그인이 필요합니다.");
      }

      console.log("accessToken!!!: ", session.access_token);
      // Edge Function 호출
      const { data, error } = await supabase.functions.invoke(
        "clever-endpoint",
        {
          body: { content: content.trim() },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (error) {
        console.error("Edge Function 오류:", error);
        throw new Error(error.message || "일기 저장 중 오류가 발생했습니다.");
      }

      if (!data.success) {
        throw new Error(data.error || "일기 저장에 실패했습니다.");
      }

      setMessage(data.message || "일기가 성공적으로 저장되었습니다!");

      // 성공 시 새로 작성된 일기의 상세 페이지로 이동
      setTimeout(() => {
        if (data.diary && data.diary.id) {
          console.log("response after diary insert: ", data);
          router.push(`/diary/${data.diary.id}`);
        } else {
          // 만약 diary ID가 없다면 일기 목록으로 이동
          router.push("/diary");
        }
      }, 100);
    } catch (error: unknown) {
      console.error("Error saving diary:", error);

      if (error && typeof error === "object" && "message" in error) {
        setMessage((error as { message: string }).message);
      } else {
        setMessage("일기 저장 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-rose-600 mb-2">오늘의 일기</h1>
          <p className="text-slate-600">
            마음껏 표현해보세요. AI가 당신의 감정을 이해해드릴게요 ✨
          </p>
        </header>

        {/* 일기 작성 폼 */}
        <div className="bg-white/40 backdrop-blur-sm rounded-3xl shadow-lg p-8 border border-white/30">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                오늘의 마음
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="오늘 하루는 어땠나요? 기쁜 일, 슬픈 일, 복잡한 마음... 무엇이든 자유롭게 적어보세요."
                className="w-full h-64 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-transparent resize-none text-gray-900 placeholder-gray-500 bg-white/80"
                required
              />
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg text-sm ${
                  message.includes("성공")
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-red-100 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    AI 분석 중...
                  </div>
                ) : (
                  "일기 저장하기"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 도움말 */}
        <div className="mt-6 text-center">
          <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <p className="text-sm text-slate-600">
              💡 일기를 저장하면 ChatGPT AI가 당신의 감정을 분석해 따뜻한
              피드백을 드려요
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
