"use client";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Diary {
  id: string;
  content: string;
  ai_feedback: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  target_date: string;
}

export default function EditDiaryPage() {
  const [diary, setDiary] = useState<Diary | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const diaryId = params.id as string;

  useEffect(() => {
    fetchDiary();
  }, [diaryId]);

  const fetchDiary = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("diaries")
        .select("*")
        .eq("id", diaryId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          setMessage("일기를 찾을 수 없습니다.");
        } else {
          throw error;
        }
        return;
      }

      setDiary(data);
      setContent(data.content);
    } catch (error) {
      console.error("Error fetching diary:", error);
      setMessage("일기를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setMessage("일기 내용을 입력해 주세요.");
      return;
    }

    setSaving(true);
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

      // Edge Function 호출 (재분석 모드)
      const { data, error } = await supabase.functions.invoke(
        "clever-endpoint",
        {
          body: {
            content: content.trim(),
            diaryId: diaryId,
            isReanalyze: true,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (error) {
        console.error("Edge Function 오류:", error);
        throw new Error(error.message || "일기 수정 중 오류가 발생했습니다.");
      }

      if (!data.success) {
        throw new Error(data.error || "일기 수정에 실패했습니다.");
      }

      setMessage(data.message || "일기가 성공적으로 수정되었습니다!");
      setTimeout(() => {
        router.push(`/diary/${diaryId}`);
      }, 1500);
    } catch (error: unknown) {
      console.error("Error updating diary:", error);
      if (error && typeof error === "object" && "message" in error) {
        setMessage((error as { message: string }).message);
      } else {
        setMessage("일기 수정 중 오류가 발생했습니다.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-rose-50 to-indigo-50">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-rose-300 rounded-full mx-auto mb-4"></div>
          <div className="text-slate-600 font-light">Loading...</div>
        </div>
      </div>
    );
  }

  if (!diary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-indigo-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white/40 backdrop-blur-sm rounded-3xl shadow-lg p-8 text-center border border-white/30">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              일기를 찾을 수 없습니다
            </h2>
            <p className="text-slate-600 mb-6">{message}</p>
            <button
              onClick={() => router.push("/diary")}
              className="bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200"
            >
              일기 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-rose-600 mb-2">
            일기 수정하기
          </h1>
          <p className="text-slate-600">마음을 다시 정리해보세요 ✨</p>
        </header>

        {/* 일기 수정 폼 */}
        <div className="bg-white/40 backdrop-blur-sm rounded-3xl shadow-lg p-8 border border-white/30">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                마음의 기록
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="마음을 다시 정리해보세요. 새로운 생각이나 감정이 있다면 자유롭게 표현해보세요."
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
                onClick={() => router.push(`/diary/${diaryId}`)}
                className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
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
                    AI 재분석 중...
                  </div>
                ) : (
                  "수정 완료"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 도움말 */}
        <div className="mt-6 text-center">
          <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <p className="text-sm text-slate-600">
              💡 일기를 수정하면 ChatGPT AI가 새로운 감정 분석을 제공해드려요
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
