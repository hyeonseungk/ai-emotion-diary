-- 감정일기 데이터베이스 설정

-- 1. diaries 테이블 생성
CREATE TABLE IF NOT EXISTS diaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  ai_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. RLS (Row Level Security) 활성화
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책 설정
-- 사용자는 자신의 일기만 조회/수정/삭제 가능
CREATE POLICY "Users can view their own diaries" ON diaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diaries" ON diaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diaries" ON diaries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diaries" ON diaries
  FOR DELETE USING (auth.uid() = user_id);

-- 4. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_diaries_user_id ON diaries(user_id);
CREATE INDEX IF NOT EXISTS idx_diaries_created_at ON diaries(created_at DESC);

-- 5. updated_at 자동 업데이트를 위한 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. updated_at 트리거 생성
CREATE TRIGGER update_diaries_updated_at 
  BEFORE UPDATE ON diaries 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 테이블 정보 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'diaries' 
ORDER BY ordinal_position; 