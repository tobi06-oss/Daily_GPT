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
