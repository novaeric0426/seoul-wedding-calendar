#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from playwright.sync_api import sync_playwright, Page
from bs4 import BeautifulSoup
import json
import logging
import re
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class WeddingHallCrawler:
    """서울시 공공예식장 크롤러"""

    def __init__(self, json_path: str = "../frontend/public/data.json"):
        self.json_path = Path(json_path)
        self.base_url = "https://wedding.seoulwomen.or.kr"
        self.facilities_url = f"{self.base_url}/facilities"
        self.page: Optional[Page] = None

    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """페이지를 가져와서 BeautifulSoup 객체로 반환"""
        try:
            self.page.goto(url, wait_until="networkidle", timeout=30000)
            # 콘텐츠가 로드될 때까지 대기
            self.page.wait_for_selector('body', timeout=10000)
            content = self.page.content()
            return BeautifulSoup(content, 'lxml')
        except Exception as e:
            logger.error(f"페이지 요청 실패: {url}, 에러: {e}")
            return None

    def parse_facilities(self, soup: BeautifulSoup) -> List[Dict]:
        """예식장 목록 파싱"""
        facilities = []

        # ul.archive_list-container.facilities 안의 링크들 찾기
        container = soup.select_one('ul.archive_list-container.facilities')
        if not container:
            logger.warning("예식장 컨테이너를 찾을 수 없습니다")
            # 디버깅: 페이지 타이틀과 body 일부 출력
            title = soup.find('title')
            logger.warning(f"페이지 타이틀: {title.get_text() if title else 'N/A'}")
            body = soup.find('body')
            if body:
                body_text = body.get_text()[:500]
                logger.warning(f"페이지 내용 일부: {body_text}")
            return facilities

        # 모든 링크 추출
        links = container.find_all('a', href=re.compile(r'/facilities/\d+'))

        for link in links:
            href = link.get('href')
            # facility_number 추출: /facilities/4187 -> 4187
            match = re.search(r'/facilities/(\d+)', href)
            if match:
                facility_number = match.group(1)

                # URL 생성
                if href.startswith('http'):
                    full_url = href
                else:
                    full_url = f"{self.base_url}{href}"

                # 상세 정보 파싱
                # 지역구
                district = link.select_one('span.inline-block.lg\\:h8')
                district_name = district.get_text(strip=True) if district else ""

                # 예식장 이름
                name = link.select_one('p.mb-2.lg\\:h5')
                facility_name = name.get_text(strip=True) if name else ""

                # 부가 정보 (야외/실내, 인원, 가격)
                info_div = link.select_one('div.mb-4.Mh8')
                location_type = ""
                capacity = ""
                price = ""

                if info_div:
                    spans = info_div.find_all('span')
                    if len(spans) >= 1:
                        location_type = spans[0].get_text(strip=True)
                    if len(spans) >= 2:
                        capacity = spans[1].get_text(strip=True)
                    if len(spans) >= 3:
                        price = spans[2].get_text(strip=True)

                facilities.append({
                    'facility_number': facility_number,
                    'district': district_name,
                    'facility_name': facility_name,
                    'location_type': location_type,
                    'capacity': capacity,
                    'price': price,
                    'url': full_url
                })
                logger.debug(f"발견: {district_name} {facility_name} (ID: {facility_number})")

        return facilities

    def get_all_facilities(self) -> List[Dict]:
        """모든 페이지에서 예식장 목록 가져오기"""
        all_facilities = []
        seen_facility_numbers = set()

        # 1~10페이지만 조회
        for page in range(1, 11):
            # 페이지 1은 /facilities, 나머지는 /facilities/page/N
            if page == 1:
                url = self.facilities_url
            else:
                url = f"{self.facilities_url}/page/{page}"
            logger.info(f"페이지 {page} 크롤링 중... ({url})")

            soup = self.fetch_page(url)
            if not soup:
                logger.warning(f"페이지 {page} 가져오기 실패")
                continue

            facilities = self.parse_facilities(soup)
            if not facilities:
                logger.info(f"페이지 {page}에서 데이터가 없습니다")
                continue

            # 중복 제거
            new_count = 0
            for facility in facilities:
                facility_number = facility['facility_number']
                if facility_number not in seen_facility_numbers:
                    seen_facility_numbers.add(facility_number)
                    all_facilities.append(facility)
                    new_count += 1

            logger.info(f"페이지 {page}: {new_count}개 발견")

        return all_facilities

    def save_to_json(self, facilities: List[Dict], reservations: List[Dict]):
        """예식장 및 예약 정보를 JSON 파일로 저장"""
        try:
            # 부모 디렉토리가 없으면 생성
            self.json_path.parent.mkdir(parents=True, exist_ok=True)

            data = {
                "lastCrawledAt": datetime.now().isoformat(),
                "facilities": facilities,
                "reservations": reservations
            }

            with open(self.json_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            logger.info(f"JSON 저장 완료: 예식장 {len(facilities)}건, 예약 {len(reservations)}건")
            logger.info(f"저장 경로: {self.json_path.absolute()}")

        except Exception as e:
            logger.error(f"JSON 저장 실패: {e}")
            raise

    def parse_calendar(self, soup: BeautifulSoup, facility_number: str, year: int, month: int) -> List[Dict]:
        """캘린더에서 예약 정보 파싱"""
        reservations = []

        # 첫 번째 tbody가 캘린더
        tbody = soup.find('tbody')
        if not tbody:
            logger.warning(f"캘린더를 찾을 수 없습니다: {facility_number}, {year}-{month}")
            return reservations

        # 모든 td 요소 탐색
        tds = tbody.find_all('td')
        for td in tds:
            # 날짜 추출
            date_span = td.find('span', class_='text-grey600')
            if not date_span:
                continue

            day = date_span.get_text(strip=True)
            if not day.isdigit():
                continue

            day = int(day)
            reservation_date = f"{year}-{month:02d}-{day:02d}"

            # 예약 상태가 있는 span 찾기
            status_span = td.find('span', class_=lambda x: x and 'flex' in x and 'flex-col' in x)
            if not status_span:
                continue

            # 그 안의 div들만 확인
            status_divs = status_span.find_all('div', class_=lambda x: x and 'inline-block' in x and 'text-center' in x)
            if not status_divs:
                continue

            # div 순서대로 시간대 할당 (첫 번째 div = L, 두 번째 div = D)
            time_slots = ['L', 'D']

            for idx, div in enumerate(status_divs):
                text = div.get_text(strip=True)

                # 1. 먼저 div 순서로 시간대 결정
                if idx < len(time_slots):
                    time_slot = time_slots[idx]
                else:
                    time_slot = f'SLOT_{idx+1}'

                # 2. 상태 결정
                status = None
                if '예약확정' in text:
                    status = 'confirmed'
                elif '오전' in text or '오후' in text:
                    status = 'available'

                # 3. 오전/오후 체크해서 time_slot 덮어쓰기
                if '오전' in text:
                    time_slot = 'L'
                elif '오후' in text:
                    time_slot = 'D'

                # 예약확정 또는 오전/오후인 경우만 저장
                if status:
                    reservations.append({
                        'facility_number': facility_number,
                        'reservation_date': reservation_date,
                        'time_slot': time_slot,
                        'status': status
                    })

        return reservations

    def get_wpnonce(self, facility_number: str) -> Optional[str]:
        """예식장 페이지에서 _wpnonce 값 추출"""
        url = f"{self.base_url}/facilities/{facility_number}"
        soup = self.fetch_page(url)
        if not soup:
            return None

        # _wpnonce 값 찾기
        nonce_match = re.search(r'_wpnonce=([a-z0-9]+)', str(soup))
        if nonce_match:
            return nonce_match.group(1)
        return None

    def fetch_reservations_for_month(self, facility_number: str, year: int, month: int, wpnonce: str) -> List[Dict]:
        """특정 예식장의 특정 월 예약 정보 가져오기"""
        url = f"{self.base_url}/facilities/{facility_number}?to={year}-{month}&_wpnonce={wpnonce}"

        soup = self.fetch_page(url)
        if not soup:
            return []

        return self.parse_calendar(soup, facility_number, year, month)

    def crawl_reservations(self, facility_numbers: List[str], year: int = 2026) -> List[Dict]:
        """모든 예식장의 예약 정보 크롤링"""
        logger.info(f"예약 정보 크롤링 시작: {len(facility_numbers)}개 예식장, {year}년")

        all_reservations = []

        for facility_number in facility_numbers:
            logger.info(f"예식장 {facility_number} 크롤링 중...")

            # wpnonce 가져오기
            wpnonce = self.get_wpnonce(facility_number)
            if not wpnonce:
                logger.warning(f"예식장 {facility_number}: wpnonce를 가져올 수 없습니다")
                continue

            for month in range(1, 13):
                logger.debug(f"  - {year}년 {month}월 크롤링...")

                try:
                    reservations = self.fetch_reservations_for_month(facility_number, year, month, wpnonce)
                    if reservations:
                        all_reservations.extend(reservations)
                        logger.debug(f"    {len(reservations)}건 발견")
                except Exception as e:
                    logger.error(f"예식장 {facility_number}, {year}-{month} 크롤링 실패: {e}")
                    continue

        logger.info(f"예약 정보 크롤링 완료: 총 {len(all_reservations)}건")
        return all_reservations

    def run(self):
        """크롤링 실행"""
        logger.info("예식장 목록 크롤링 시작")

        with sync_playwright() as p:
            # Chromium 브라우저 실행 (headless 모드)
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080}
            )
            self.page = context.new_page()

            try:
                # 모든 예식장 정보 가져오기
                facilities = self.get_all_facilities()
                logger.info(f"총 {len(facilities)}개 예식장 발견")

                if facilities:
                    # 결과 출력
                    for facility in facilities:
                        print(f"ID: {facility['facility_number']}, "
                              f"지역: {facility['district']}, "
                              f"이름: {facility['facility_name']}, "
                              f"타입: {facility['location_type']}, "
                              f"인원: {facility['capacity']}, "
                              f"가격: {facility['price']}")

                    # 예약 정보 크롤링
                    logger.info("\n예약 정보 크롤링 시작")
                    facility_numbers = [f['facility_number'] for f in facilities]
                    reservations = self.crawl_reservations(facility_numbers)

                    # JSON 파일로 저장
                    self.save_to_json(facilities, reservations)

                else:
                    logger.warning("파싱된 데이터가 없습니다")

            except Exception as e:
                logger.error(f"크롤링 중 에러 발생: {e}")
                raise
            finally:
                browser.close()


if __name__ == "__main__":
    crawler = WeddingHallCrawler()
    crawler.run()
