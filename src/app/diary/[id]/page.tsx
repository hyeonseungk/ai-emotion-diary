"use client";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
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

export default function DiaryDetailPage() {
  const [diary, setDiary] = useState<Diary | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
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
    } catch (error) {
      console.error("Error fetching diary:", error);
      setMessage("일기를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말로 이 일기를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("diaries")
        .delete()
        .eq("id", diaryId);

      if (error) throw error;

      setMessage("일기가 삭제되었습니다.");
      setTimeout(() => {
        router.push("/diary");
      }, 1500);
    } catch (error) {
      console.error("Error deleting diary:", error);
      setMessage("일기 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleReanalyze = async () => {
    if (!diary) return;

    setAnalyzing(true);
    setMessage(null);

    try {
      // 새로운 AI 분석 요청
      const newFeedback = await analyzeEmotion();

      const { error } = await supabase
        .from("diaries")
        .update({ ai_feedback: newFeedback })
        .eq("id", diaryId);

      if (error) throw error;

      // 로컬 상태 업데이트
      setDiary((prev) => (prev ? { ...prev, ai_feedback: newFeedback } : null));
      setMessage("감정 분석이 완료되었습니다!");
    } catch (error) {
      console.error("Error reanalyzing:", error);
      setMessage("감정 분석 중 오류가 발생했습니다.");
    } finally {
      setAnalyzing(false);
    }
  };

  // 임시 AI 감정 분석 함수 (나중에 OpenAI API로 교체)
  const analyzeEmotion = async (): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // 2초 대기

    const emotions = [
      "다시 읽어보니 더 깊은 감정이 느껴져요. 당신의 마음을 이해하고 있어요.",
      "시간이 지나면서 새로운 관점으로 바라볼 수 있게 되었네요.",
      "이런 순간들이 당신을 더 성숙하게 만들어가고 있어요.",
      "감정의 흐름을 잘 표현하고 계시네요. 정말 대단해요.",
      "작은 변화들이 모여 큰 성장을 만들어가고 있어요.",
    ];

    return emotions[Math.floor(Math.random() * emotions.length)];
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
      <div className="container mx-auto px-4 max-w-3xl">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-rose-600 mb-2">
            일기 상세보기
          </h1>
          <p className="text-gray-600">
            {format(new Date(diary.created_at), "yyyy년 M월 d일 EEEE", {
              locale: ko,
            })}
          </p>
        </header>

        {/* 일기 내용 */}
        <div className="bg-white/80 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            오늘의 마음
          </h2>
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {diary.content}
            </p>
          </div>

          {/* AI 피드백 */}
          {diary.ai_feedback && (
            <div className="bg-rose-50 rounded-lg p-6 border-l-4 border-rose-400">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                💭 AI의 따뜻한 피드백
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {diary.ai_feedback}
              </p>
            </div>
          )}
        </div>

        {/* 메시지 */}
        {message && (
          <div
            className={`p-4 rounded-lg text-sm mb-6 ${
              message.includes("완료") || message.includes("삭제")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => router.push("/diary")}
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            목록으로 돌아가기
          </button>

          <button
            onClick={handleReanalyze}
            disabled={analyzing}
            className="bg-teal-400 hover:bg-teal-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-60"
          >
            {analyzing ? "분석 중..." : "다시 분석하기"}
          </button>

          <button
            onClick={() => router.push(`/diary/${diaryId}/edit`)}
            className="bg-blue-400 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            수정하기
          </button>

          <button
            onClick={handleDelete}
            className="bg-red-400 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}
