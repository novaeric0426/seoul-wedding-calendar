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

soup = BeautifulSoup(response.content, 'lxml')

# 첫 번째 tbody (캘린더)
calendar_tbody = soup.find('tbody')
if calendar_tbody:
    print("캘린더 tbody 전체 내용:")
    print("="*80)

    # 파일로 저장
    with open('calendar_tbody.html', 'w', encoding='utf-8') as f:
        f.write(calendar_tbody.prettify())
    print("calendar_tbody.html에 저장 완료\n")

    # 모든 td 요소 찾기
    tds = calendar_tbody.find_all('td')
    print(f"총 {len(tds)}개의 td 요소 발견\n")

    # 텍스트가 있는 td만 출력 (처음 20개)
    print("날짜 셀 샘플 (처음 20개):")
    print("-"*80)
    for i, td in enumerate(tds[:20]):
        text_content = td.get_text(strip=True)
        if text_content:
            print(f"TD #{i+1}: {text_content[:100]}")
            if '예약' in text_content or '확정' in text_content:
                print(f"  -> HTML: {td.prettify()[:300]}")

    # "예약" 키워드가 있는 모든 요소 찾기
    print("\n\n'예약' 텍스트가 포함된 요소:")
    print("-"*80)
    reservation_elements = calendar_tbody.find_all(string=lambda text: text and '예약' in text)
    for elem in reservation_elements[:10]:
        parent = elem.parent
        print(f"텍스트: {elem.strip()}")
        print(f"부모 태그: {parent.name}, 클래스: {parent.get('class')}")
        print(f"전체 셀 텍스트: {parent.parent.get_text(strip=True)[:100]}")
        print()

else:
    print("tbody를 찾을 수 없습니다")

# 전체 HTML에서 "예약불가" 검색
print("\n\n전체 페이지에서 '예약불가' 검색:")
print("-"*80)
if '예약불가' in response.text:
    print("'예약불가' 텍스트 발견!")
    # 해당 텍스트 주변 200자 출력
    idx = response.text.index('예약불가')
    print(f"주변 텍스트: ...{response.text[max(0, idx-100):idx+100]}...")
else:
    print("'예약불가' 텍스트 없음")

if '예약확정' in response.text:
    print("\n'예약확정' 텍스트 발견!")
    idx = response.text.index('예약확정')
    print(f"주변 텍스트: ...{response.text[max(0, idx-100):idx+100]}...")
else:
    print("'예약확정' 텍스트 없음")
