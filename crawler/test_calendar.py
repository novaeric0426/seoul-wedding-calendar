#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
from bs4 import BeautifulSoup

# 테스트용 URL (4월 데이터)
url = "https://wedding.seoulwomen.or.kr/facilities/4187?to=2026-4&_wpnonce=5767884a9b"

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

print("페이지 요청 중...")
response = requests.get(url, headers=headers, timeout=10)
response.raise_for_status()

print(f"응답 상태 코드: {response.status_code}")
print(f"응답 크기: {len(response.content)} bytes\n")

soup = BeautifulSoup(response.content, 'lxml')

# tbody 찾기
tbodies = soup.find_all('tbody')
print(f"발견된 tbody 개수: {len(tbodies)}\n")

for i, tbody in enumerate(tbodies):
    print(f"\n{'='*60}")
    print(f"tbody #{i+1}")
    print(f"{'='*60}")
    print(tbody.prettify()[:1000])  # 첫 1000자만 출력
    print("...")

# 캘린더 관련 div 찾기
calendar_divs = soup.find_all('div', class_=lambda x: x and 'calendar' in x.lower())
print(f"\n\n캘린더 관련 div 개수: {len(calendar_divs)}")
for div in calendar_divs[:3]:
    print(f"\nClass: {div.get('class')}")
    print(div.prettify()[:500])

# data- 속성이 있는 요소 찾기
data_elements = soup.find_all(lambda tag: any(attr.startswith('data-') for attr in tag.attrs))
print(f"\n\ndata- 속성을 가진 요소 개수: {len(data_elements)}")
for elem in data_elements[:10]:
    print(f"\n태그: {elem.name}, 속성: {elem.attrs}")
