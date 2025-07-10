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
      const { error } = await supabase
        .from("diaries")
        .update({
          content: content.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", diaryId);

      if (error) throw error;

      setMessage("일기가 성공적으로 수정되었습니다!");
      setTimeout(() => {
        router.push(`/diary/${diaryId}`);
      }, 1500);
    } catch (error: unknown) {
      console.error("Error updating diary:", error);
      if (error && typeof error === "object" && "message" in error) {
        setMessage(
          (error as { message: string }).message ||
            "일기 수정 중 오류가 발생했습니다."
        );
      } else {
        setMessage("일기 수정 중 오류가 발생했습니다.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
          <p className="text-gray-600">일기를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!diary) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-teal-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white/80 rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              일기를 찾을 수 없습니다
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push("/diary")}
              className="bg-rose-400 hover:bg-rose-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              일기 목록으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-teal-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-rose-600 mb-2">
            일기 수정하기
          </h1>
          <p className="text-gray-600">마음을 다시 정리해보세요 ✨</p>
        </header>

        {/* 일기 수정 폼 */}
        <div className="bg-white/80 rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                오늘의 마음
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="오늘 하루는 어땠나요? 기쁜 일, 슬픈 일, 복잡한 마음... 무엇이든 자유롭게 적어보세요."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-transparent resize-none"
                required
              />
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg text-sm ${
                  message.includes("성공")
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push(`/diary/${diaryId}`)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-rose-400 hover:bg-rose-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? "저장 중..." : "수정 완료"}
              </button>
            </div>
          </form>
        </div>

        {/* 도움말 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 일기를 수정하면 AI가 새로운 감정 분석을 제공할 수 있어요</p>
        </div>
      </div>
    </div>
  );
}
