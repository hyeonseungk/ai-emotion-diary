"use client";
import { supabase } from "@/lib/supabaseClient";
import { format, isAfter, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Diary {
  id: string;
  content: string;
  ai_feedback: string;
  created_at: string;
  updated_at: string;
  target_date: string;
}

export default function DateDiariesPage() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFutureModal, setShowFutureModal] = useState(false);
  const router = useRouter();
  const params = useParams();
  const dateParam = params.date as string;

  useEffect(() => {
    fetchDiariesForDate();
  }, [dateParam]);

  const fetchDiariesForDate = async () => {
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
        .eq("target_date", dateParam)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDiaries(data || []);
    } catch (error) {
      console.error("Error fetching diaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayDate = () => {
    try {
      const date = new Date(dateParam);
      return format(date, "yyyy년 M월 d일 EEEE", { locale: ko });
    } catch {
      return dateParam;
    }
  };

  const isFutureDate = () => {
    try {
      const selectedDate = new Date(dateParam);
      const today = startOfDay(new Date());
      return isAfter(selectedDate, today);
    } catch {
      return false;
    }
  };

  const handleWriteClick = () => {
    if (isFutureDate()) {
      setShowFutureModal(true);
    } else {
      router.push(`/diary/new?date=${dateParam}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50 to-indigo-50">
      {/* 네비게이션 */}
      <nav className="sticky top-0 z-10 backdrop-blur-xl bg-white/70 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link href="/diary" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-semibold">감</span>
              </div>
              <h1 className="text-2xl font-light text-slate-800 tracking-wide">
                감정일기
              </h1>
            </Link>

            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-white/50 rounded-xl transition-all duration-200"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                달력으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-16">
        {/* 헤더 섹션 */}
        <section className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-light text-slate-800 mb-6 tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500 font-normal">
              {getDisplayDate()}
            </span>
            의 기록
          </h2>
          <p className="text-xl text-slate-600 font-light leading-relaxed mb-12">
            {diaries.length > 0
              ? `이 날에 작성한 ${diaries.length}개의 일기를 확인해보세요`
              : isFutureDate()
              ? "미래의 날짜예요"
              : "아직 작성한 일기가 없어요"}
          </p>

          {/* 새 일기 작성 버튼 */}
          {!isFutureDate() && (
            <div className="flex justify-center">
              <button
                onClick={handleWriteClick}
                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <svg
                  className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                이 날에 일기 쓰기
              </button>
            </div>
          )}
        </section>

        {/* 일기 목록 */}
        <section>
          {diaries.length === 0 ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-12 text-center border border-white/30 shadow-lg">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-8">
                  <svg
                    className="w-12 h-12 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                {isFutureDate() ? (
                  <>
                    <h3 className="text-2xl font-semibold text-slate-800 mb-4">
                      미래의 날짜예요
                    </h3>
                    <p className="text-lg text-slate-600 font-light mb-8">
                      {getDisplayDate()}은 아직 오지 않은 날이에요.
                      <br />
                      그날이 되면 일기를 작성해보세요!
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-semibold text-slate-800 mb-4">
                      작성한 일기가 없어요
                    </h3>
                    <p className="text-lg text-slate-600 font-light mb-8">
                      {getDisplayDate()}에 첫 번째 일기를 작성해보세요!
                    </p>
                    <button
                      onClick={handleWriteClick}
                      className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                      일기 작성하기
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {diaries.map((diary, index) => (
                <div
                  key={diary.id}
                  className="group bg-white/40 backdrop-blur-sm rounded-3xl p-8 border border-white/30 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                  onClick={() => router.push(`/diary/${diary.id}`)}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center">
                        <span className="text-rose-500 font-bold text-lg">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-slate-800 font-semibold">
                          {diaries.length > 1
                            ? `${index + 1}번째 일기`
                            : "일기"}
                        </p>
                        <p className="text-sm text-slate-500 font-light">
                          {format(new Date(diary.created_at), "HH:mm에 작성", {
                            locale: ko,
                          })}
                        </p>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>

                  <div className="mb-6">
                    <p className="text-slate-700 leading-relaxed line-clamp-3 text-lg font-light">
                      {diary.content}
                    </p>
                  </div>

                  {diary.ai_feedback && (
                    <div className="bg-gradient-to-r from-rose-50/80 to-pink-50/80 rounded-2xl p-6 border border-rose-100/50">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 font-medium mb-1">
                            AI 감정 분석
                          </p>
                          <p className="text-slate-700 font-light leading-relaxed">
                            {diary.ai_feedback}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 미래 날짜 에러 모달 */}
      {showFutureModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/30 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 mb-4">
                아직 쓸 수 없어요
              </h3>
              <p className="text-lg text-slate-600 font-light mb-8 leading-relaxed">
                오늘보다 이후인 날짜에 대한
                <br />
                일기는 아직 쓸 수 없어요
              </p>
              <button
                onClick={() => setShowFutureModal(false)}
                className="w-full bg-gradient-to-r from-rose-400 to-pink-500 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                확인했어요
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 푸터 */}
      <footer className="border-t border-white/20 mt-20">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <div className="flex items-center justify-center">
            <Link
              href="/diary"
              className="text-slate-400 hover:text-slate-600 text-sm font-light transition-colors duration-200"
            >
              달력으로 돌아가기
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
