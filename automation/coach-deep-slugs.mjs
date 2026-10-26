/** 登入碼門檻頁（部署至 Pages，前端 session 驗證；根目錄 stubs 僅作舊連結相容時可選） */
export const DEEP_SEN_FILES = [
  'sen-swim-learning.html',
  'sen-swim-down-syndrome.html',
  'sen-swim-intellectual.html',
  'sen-swim-physical.html',
  'sen-swim-sensory.html',
  'sen-swim-communication.html',
  'sen-swim-behavior.html',
  'sen-swim-classroom.html',
  'sen-swim-wellbeing.html',
  'sen-swim-development.html',
];

export const PUBLIC_SEN_FILES = [
  'sen-guide.html',
  'sen-support-hk.html',
  'sen-swim-first-lesson.html',
  'sen-swim-benefits.html',
  'sen-swim-safety.html',
  'sen-swim-autism.html',
  'sen-swim-adhd.html',
];

export function slugFromFile(file) {
  return String(file || '').replace(/\.html$/i, '');
}
