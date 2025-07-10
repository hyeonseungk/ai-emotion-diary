"use client";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Diary {
  id: string;
  content: string;
  ai_feedback: string;
  created_at: string;
  updated_at: string;
}

export default function DiaryListPage() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const router = useRouter();

  useEffect(() => {
    fetchDiaries();
  }, []);

  const fetchDiaries = async () => {
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
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDiaries(data || []);
    } catch (error) {
      console.error("Error fetching diaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-teal-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-rose-600 mb-2">
            나의 감정일기
          </h1>
          <p className="text-gray-600 mb-4">
            기록한 일기들을 돌아보며 성장을 확인해보세요
          </p>

          {/* 뷰 모드 전환 */}
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-rose-400 text-white"
                  : "bg-white/80 text-gray-600 hover:bg-white"
              }`}
            >
              📝 리스트 보기
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === "calendar"
                  ? "bg-rose-400 text-white"
                  : "bg-white/80 text-gray-600 hover:bg-white"
              }`}
            >
              📅 달력 보기
            </button>
          </div>

          {/* 새 일기 작성 버튼 */}
          <button
            onClick={() => router.push("/diary/new")}
            className="bg-rose-400 hover:bg-rose-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-lg"
          >
            ✍️ 새 일기 쓰기
          </button>
        </header>

        {/* 일기 목록 */}
        <main>
          {diaries.length === 0 ? (
            <div className="bg-white/80 rounded-xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">📖</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                아직 기록된 일기가 없어요
              </h3>
              <p className="text-gray-600 mb-6">첫 번째 일기를 작성해보세요!</p>
              <button
                onClick={() => router.push("/diary/new")}
                className="bg-rose-400 hover:bg-rose-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                첫 일기 쓰기
              </button>
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-4">
              {diaries.map((diary) => (
                <div
                  key={diary.id}
                  className="bg-white/80 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => router.push(`/diary/${diary.id}`)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm text-gray-500">
                      {format(
                        new Date(diary.created_at),
                        "yyyy년 M월 d일 EEEE",
                        { locale: ko }
                      )}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-800 line-clamp-3">
                      {diary.content}
                    </p>
                  </div>

                  {diary.ai_feedback && (
                    <div className="bg-rose-50 rounded-lg p-4 border-l-4 border-rose-400">
                      <p className="text-sm text-gray-700">
                        💭 {diary.ai_feedback}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/80 rounded-xl shadow-lg p-6">
              <p className="text-center text-gray-600">
                달력 뷰는 추후 업데이트 예정입니다 📅
              </p>
            </div>
          )}
        </main>

        {/* 로그아웃 버튼 */}
        <div className="text-center mt-8">
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
