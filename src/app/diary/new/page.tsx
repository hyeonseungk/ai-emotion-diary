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
      // 1. 일기 저장
      const { data: diary, error: diaryError } = await supabase
        .from("diaries")
        .insert([
          {
            content: content.trim(),
            user_id: (await supabase.auth.getUser()).data.user?.id,
          },
        ])
        .select()
        .single();

      if (diaryError) throw diaryError;

      // 2. AI 감정 분석 요청 (실제로는 OpenAI API 호출)
      const aiFeedback = await analyzeEmotion();

      // 3. AI 피드백 업데이트
      const { error: updateError } = await supabase
        .from("diaries")
        .update({ ai_feedback: aiFeedback })
        .eq("id", diary.id);

      if (updateError) throw updateError;

      setMessage("일기가 성공적으로 저장되었습니다!");
      setTimeout(() => {
        router.push("/diary");
      }, 1500);
    } catch (error: unknown) {
      console.error("Error saving diary:", error);
      if (error && typeof error === "object" && "message" in error) {
        setMessage(
          (error as { message: string }).message ||
            "일기 저장 중 오류가 발생했습니다."
        );
      } else {
        setMessage("일기 저장 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 임시 AI 감정 분석 함수 (나중에 OpenAI API로 교체)
  const analyzeEmotion = async (): Promise<string> => {
    // 실제로는 OpenAI API를 호출해야 함
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기

    const emotions = [
      "오늘 하루 정말 수고하셨어요. 당신의 감정을 이해하고 있어요.",
      "기분이 좋으신 것 같아요! 이런 순간들을 더 많이 가져보세요.",
      "조금 지치신 것 같아요. 잠깐의 휴식을 취해보는 건 어떨까요?",
      "복잡한 마음이신 것 같아요. 천천히 정리해보세요.",
      "평온한 하루를 보내고 계시는군요. 이런 평화로운 순간이 소중해요.",
    ];

    return emotions[Math.floor(Math.random() * emotions.length)];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-teal-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-rose-600 mb-2">오늘의 일기</h1>
          <p className="text-gray-600">
            마음껏 표현해보세요. AI가 당신의 감정을 이해해드릴게요 ✨
          </p>
        </header>

        {/* 일기 작성 폼 */}
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
                onClick={() => router.back()}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-rose-400 hover:bg-rose-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-60"
              >
                {loading ? "저장 중..." : "일기 저장하기"}
              </button>
            </div>
          </form>
        </div>

        {/* 도움말 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            💡 일기를 저장하면 AI가 당신의 감정을 분석해 따뜻한 피드백을 드려요
          </p>
        </div>
      </div>
    </div>
  );
}
