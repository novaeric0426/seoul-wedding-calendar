# 서울시 공공예식장 예약 캘린더

서울시 공공예식장([wedding.seoulwomen.or.kr](https://wedding.seoulwomen.or.kr))의 예약 현황을 자동으로 수집하여 캘린더 형태로 보여주는 웹사이트입니다.

## 주요 기능

- 서울시 내 공공예식장 전체 목록 조회 (지역구, 인원, 가격 정보 포함)
- 예식장별 월별 예약 현황 캘린더 표시 (오전/오후 시간대 구분)
- 매 1시간마다 자동 데이터 갱신 (GitHub Actions)
- GitHub Pages로 정적 사이트 호스팅

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Crawler | Python 3.11, Playwright, BeautifulSoup4 |
| CI/CD | GitHub Actions |
| Hosting | GitHub Pages |

## 프로젝트 구조

```
wedding-calender/
├── .github/
│   └── workflows/
│       ├── crawl.yml       # 크롤러 스케줄 실행 (매 1시간)
│       └── deploy.yml      # GitHub Pages 배포
├── crawler/
│   ├── crawler.py          # 크롤링 스크립트 (Playwright)
│   └── requirements.txt
├── frontend/
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

## 동작 방식

```
[GitHub Actions - 매 1시간]
        |
        v
  crawler.py 실행
  (Playwright + BeautifulSoup4)
        |
        v
  예식장 목록 + 예약 현황 수집
        |
        v
  frontend/public/data.json 갱신
        |
        v
  변경사항 자동 커밋 & 푸시
        |
        v
  GitHub Pages 자동 재배포
```

## 로컬 개발

### 크롤러 실행

```bash
cd crawler
pip install -r requirements.txt
playwright install chromium
python crawler.py
```

실행하면 `frontend/public/data.json` 파일이 생성됩니다.

### 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173` 에서 확인할 수 있습니다.

## data.json 포맷

```json
{
  "lastCrawledAt": "2026-02-24T06:00:00.000000",
  "facilities": [
    {
      "facility_number": "4187",
      "district": "강남구",
      "facility_name": "예식장 이름",
      "location_type": "실내",
      "capacity": "100명",
      "price": "100만원",
      "url": "https://wedding.seoulwomen.or.kr/facilities/4187"
    }
  ],
  "reservations": [
    {
      "facility_number": "4187",
      "reservation_date": "2026-03-01",
      "time_slot": "L",
      "status": "confirmed"
    }
  ]
}
```

- `time_slot`: `L` = 오전, `D` = 오후
- `status`: `confirmed` = 예약확정, `available` = 예약가능

## 배포

`main` 브랜치에 push 시 GitHub Pages로 자동 배포됩니다.
