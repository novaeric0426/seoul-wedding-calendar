# 서울시 공공예식장 예약 캘린더

서울시 공공예식장 예약 현황을 크롤링하여 깔끔한 캘린더 형태로 보여주는 웹사이트

## 프로젝트 구조
```
seoul-wedding-calendar/
├── .github/
│   └── workflows/
│       ├── deploy.yml      # GitHub Pages 배포
│       └── crawl.yml       # 크롤러 스케줄 실행
├── crawler/                # Python 크롤러
│   ├── crawler.py          # 크롤링 스크립트
│   └── requirements.txt
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   ├── api/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   │   └── data.json       # 크롤링 데이터 (자동 생성)
│   ├── package.json
│   └── vite.config.ts
└── CLAUDE.md
```

## 기술 스택

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Crawler**: Python (requests + BeautifulSoup4)
- **Deployment**: GitHub Pages
- **CI/CD**: GitHub Actions

## 동작 방식

1. **크롤러** (GitHub Actions - 매일 오전 6시 KST)
   - 서울시 공공예식장 사이트에서 예약 정보 수집
   - `frontend/public/data.json` 파일 생성
   - 변경사항 있으면 자동 커밋 & 푸시

2. **프론트엔드** (정적 사이트)
   - `data.json` 파일을 fetch하여 렌더링
   - GitHub Pages로 호스팅

## 로컬 개발

```bash
# 크롤러 실행
cd crawler
pip install -r requirements.txt
python crawler.py

# 프론트엔드 실행
cd frontend
npm install
npm run dev
```

## 배포

- **URL**: https://[username].github.io/seoul-wedding-calendar/
- main 브랜치에 push 시 자동 배포
