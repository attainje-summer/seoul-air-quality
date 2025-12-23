# 빠른 시작 가이드 🚀

## GitHub Pages로 웹 배포하기

### 1️⃣ API 키 설정
`config.js` 파일을 열어서 4번째 줄의 API 키를 수정하세요:
```javascript
DEFAULT_API_KEY: '여기에_발급받은_API_키_입력',
```

### 2️⃣ GitHub 저장소에 업로드
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/사용자명/저장소명.git
git push -u origin main
```

### 3️⃣ GitHub Pages 활성화
1. GitHub 저장소 → **Settings** → **Pages**
2. **Branch**: `main` 선택, **Folder**: `/ (root)` 선택
3. **Save** 클릭
4. 완료! 몇 분 후 `https://사용자명.github.io/저장소명/` 에서 접속 가능

---

## 로컬에서 실행하기

### 방법 1: Live Server (권장)
1. VS Code에서 `index.html` 우클릭
2. "Open with Live Server" 선택

### 방법 2: Python 서버
```bash
# Python 3
python -m http.server 8000

# 브라우저에서 http://localhost:8000 접속
```

---

## API 키 발급 방법
1. [공공데이터포털](https://www.data.go.kr) 회원가입
2. "에어코리아 대기오염정보" 검색
3. 활용신청 (승인까지 1-2시간 소요)
