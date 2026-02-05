#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from crawler import WeddingHallCrawler
import sqlite3

# 테스트용 DB 초기화
conn = sqlite3.connect("test_data.db")
cursor = conn.cursor()

# 테이블 생성
cursor.execute('''
    CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        facility_number TEXT NOT NULL,
        reservation_date DATE NOT NULL,
        time_slot TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(facility_number, reservation_date, time_slot)
    )
''')
conn.commit()
conn.close()

# 테스트용 크롤러 생성
crawler = WeddingHallCrawler(db_path="test_data.db")

# 테스트: 예식장 4187의 2026년 4월 데이터만 크롤링
print("="*80)
print("테스트: 예식장 4187, 2026년 4월 크롤링")
print("="*80)

reservations = crawler.fetch_reservations_for_month("4187", 2026, 4)

print(f"\n발견된 예약 정보: {len(reservations)}건\n")

# 처음 10개 출력
for i, res in enumerate(reservations[:10]):
    print(f"{i+1}. {res['reservation_date']} {res['time_slot']}: {res['status']}")

# DB에 저장
print("\nDB에 저장 중...")
crawler.save_reservations_to_db(reservations)

# DB에서 조회
print("\nDB에서 조회:")
conn = sqlite3.connect("test_data.db")
cursor = conn.cursor()

cursor.execute('''
    SELECT reservation_date, time_slot, status
    FROM reservations
    WHERE facility_number = '4187'
    ORDER BY reservation_date, time_slot
    LIMIT 15
''')

rows = cursor.fetchall()
for row in rows:
    print(f"{row[0]} {row[1]}: {row[2]}")

conn.close()

print("\n테스트 완료!")
