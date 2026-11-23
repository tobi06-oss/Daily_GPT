# 하루결 · Daily GPT

일정과 할 일, 일기를 한 장의 하루로 모으는 개인용 라이프 플래너

GPT 독립 Phase 1 프로토타입 · Claude 버전과 비교용

## 접속

https://tobi06-oss.github.io/Daily_GPT/

## GitHub Pages 배포

이 저장소는 소스 코드를 직접 게시하는 방식이 아니라, `React + TypeScript + Vite`를 GitHub Actions로 빌드한 후 `dist/`를 GitHub Pages에 배포하는 방식입니다

1. Settings → Pages → Build and deployment → Source에서 **GitHub Actions** 선택
2. [Actions](https://github.com/tobi06-oss/Daily_GPT/actions) → **Deploy Daily GPT** 실행 내역 확인
3. 초록색 성공 체크가 표시되면 위 주소에서 접속
4. 404가 나면 Actions의 실패 단계 및 Pages 설정을 확인

## 개발 실행

```bash
npm install
npm run dev
npm run build
```

## 구현 범위

- Today, Calendar, Journal, Quick Capture
- 기본 반복 일정, 할 일 완료·미루기, 일기·감정 기록
- localStorage의 `lifeplanner.v1` 저장
- 반응형 화면, 기본 다크모드 및 PWA 설정

Phase 1은 테스트용입니다. Supabase·기기 간 동기화·알림은 포함되지 않으며, 브라우저 데이터 삭제 시 저장 내용이 유실될 수 있습니다

문구는 마침표 없이 부드럽게 구성하고 나눔스퀘어 글꼴을 적용합니다


## Phase 1 추가 기능 (2026-11-23)

- **Today 리듬 카드:** 시간대 인사, 지금/다음 일정 카운트다운, 7일 한 줄 달력, 할 일 진행도
- **기록:** 날짜별 회고 질문, 이틀 이상 연속 기록, 지난 오늘(1주·1달·1년), 저녁 요약
- **주간 목표:** 주 1~7회 목표, 일~토 체크, 달성/초과 안내, 일정 제목 자동 연결
- **빠른 입력:** `주 3회 러닝` 및 `일주일에 2번 수영`을 주간 목표로 제안
- **기상·취침:** 현재 시간 기록, 직접 입력·수정·삭제, 수면 시간 및 주간 평균
- **설정:** 하루 시작 시각(0~6시), iPhone 단축어 주소 복사
- **주소:** `#wake`, `#sleep`, `#write`, `#add`

**중요:** iOS Safari 단축어와 홈 화면 PWA는 로컬 저장소가 분리될 수 있으므로, 서버가 없는 이번 Phase 1에서 잠금화면 기상·취침 기록이 홈 화면 앱에 자동 반영되는 것은 보장하지 않습니다. 자세한 대안은 `docs/DECISIONS.md`에 기록했습니다

**실제 iPhone 사용 확인 전에는 잠금화면 기록 기능을 완료로 처리하지 않습니다**
