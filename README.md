# Wonsik Lee — Architecture Portfolio

이원식 건축 포트폴리오 웹사이트입니다. GitHub Pages 및 로컬(`file://`) 환경 모두에서 별도 빌드 과정 없이 동작하도록 구성했습니다.

## 폴더 구조

```
wonsik-portfolio/
├── index.html       # 시맨틱 HTML5 구조 및 라이트박스 마크업
├── css/
│   └── style.css    # 라이트/다크 테마, 반투명 헤더, 타이포그래피, 반응형 레이아웃
├── js/
│   ├── projects.js  # 전체 28개 프로젝트 데이터
│   └── app.js       # 해시 라우팅, View Transitions, 이미지 폴백, 라이트박스 제어
└── .nojekyll        # GitHub Pages Jekyll 비활성화
```

## 로컬 이미지 폴더 연결

2025–2026년 일부 프로젝트(`용산고`, `당곡고`, `강동송파수과융합센터`, `신도리코 본사 리뉴얼`)는 아래 폴더명을 루트 또는 `images/` 폴더 안에 두면 자동으로 인식됩니다.

- `H_2026-03_용산고 고교학점제/` (`1.jpg` ~ `7.jpg` 또는 `.png`)
- `H_2026-05_당곡고 고교학점제/` (`1.jpg` ~ `9.jpg` 또는 `.png`)
- `H_2026-01_강동송파수과융합센터/` (`1.jpg` ~ `12.jpg` 또는 `.png`)
- `H_2025-12_신도리코 서울본사 리뉴얼/` (`1.jpg` ~ `14.jpg` 또는 `.png`)

## GitHub Pages 업로드 방법

1. GitHub에서 새 저장소를 생성합니다.
2. `wonsik-portfolio` 폴더 **안의 파일과 폴더들**(`index.html`, `css/`, `js/`, `.nojekyll` 및 이미지 폴더)을 저장소 루트에 업로드합니다.
3. 저장소 `Settings → Pages → Build and deployment`에서 `Branch: main / (root)`를 선택해 배포합니다.
