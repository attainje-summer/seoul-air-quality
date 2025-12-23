# 서울 미세먼지 예보 앱 🌫️

서울 지역의 미세먼지(PM10) 및 초미세먼지(PM2.5) 예보를 확인할 수 있는 모바일 웹 애플리케이션입니다.

## 주요 기능

- 📱 모바일 최적화 디자인
- 🌫️ 미세먼지(PM10) 오늘/내일 예보
- 🌪️ 초미세먼지(PM2.5) 오늘/내일 예보
- 🔄 자동 새로고침 (4시간마다)
- 💾 로컬 데이터 캐싱
- 🎨 등급별 색상 구분 (좋음/보통/나쁨/매우나쁨)

## GitHub Pages로 배포하기

### 1. API 키 설정

1. [공공데이터포털](https://www.data.go.kr)에서 API 키 발급
2. `config.js` 파일의 `DEFAULT_API_KEY` 값을 발급받은 API 키로 변경

```javascript
DEFAULT_API_KEY: '여기에_발급받은_API_키_입력',
```

### 2. GitHub 저장소 생성 및 업로드

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/사용자명/저장소명.git
git push -u origin main
```

### 3. GitHub Pages 활성화

1. GitHub 저장소 페이지에서 **Settings** 탭 클릭
2. 왼쪽 메뉴에서 **Pages** 클릭
3. **Source** 섹션에서:
   - Branch: `main` 선택
   - Folder: `/ (root)` 선택
   - **Save** 버튼 클릭
4. 몇 분 후 `https://사용자명.github.io/저장소명/` 에서 접속 가능

### 4. 홈 화면에 추가 (PWA)

**iOS (Safari):**
1. 공유 버튼 탭
2. "홈 화면에 추가" 선택

**Android (Chrome):**
1. 메뉴(⋮) 탭
2. "홈 화면에 추가" 선택

## 기술 스택

- HTML5
- CSS3 (Vanilla CSS)
- JavaScript (ES6+)
- AirKorea API

## 데이터 출처

- [한국환경공단 에어코리아](https://www.airkorea.or.kr)
- 공공데이터포털 API

## 라이선스

MIT License
