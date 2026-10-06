# 모험 안내서

마인크래프트 RPG 서버의 플레이어용 웹 가이드입니다.
Next.js(App Router)로 만든 정적 사이트이며, 빌드 결과물 `out/` 을 GitHub Pages에 올립니다. 서버와 DB는 쓰지 않습니다.

## 준비

- Node.js 20.9 이상
- 처음 한 번 `npm ci`

## 명령

| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 개발 서버 (http://localhost:3000) |
| `npm run build` | 검증, 에셋 생성, 정적 빌드. 결과는 `out/` |
| `npm run preview` | `out/` 을 로컬에서 띄움 (http://localhost:4173) |
| `npm run validate` | `data/` 의 id 참조 검사만 실행 |
| `npm run lint:rules` | 디자인 규칙 검사 (가운뎃점, hover, grid, radius 등) |

## 데이터 갱신

1. `data/` 안의 `*.yml` 을 새 파일로 덮어씁니다. 파일 이름과 구조는 그대로 둡니다.
2. `main` 브랜치에 push 합니다.
3. GitHub Actions가 다시 빌드해서 배포합니다. 2~3분 걸립니다.

로컬에서 먼저 보려면 `npm run build` 뒤 `npm run preview` 를 실행합니다.

화면의 수치는 전부 빌드 때 `data/*.yml` 에서 읽습니다. 화면 코드에 직접 적은 수치는 없습니다.

빌드 첫 단계에서 id 참조를 검사합니다. 끊긴 참조가 있으면 콘솔에 목록이 나오고 `src/generated/broken-ids.json` 에 저장됩니다. 끊긴 참조는 경고로만 남기고 빌드는 계속합니다(해당 항목은 링크 없이 글자로 표시). 필수 키가 없거나 주소가 겹치면 빌드를 멈춥니다.

같은 `data/` 로 빌드하면 항상 같은 결과물이 나옵니다. `node scripts/hash-out.mjs` 로 `out/` 의 해시를 비교할 수 있습니다.

## 공지 추가

1. `content/notices/_양식-긴급점검.md` 를 복사합니다.
2. 이름을 `날짜-제목.md` 로 바꿉니다. 예: `2026-10-20-긴급점검.md`
3. 내용을 쓰고 push 합니다.

- 첫 줄 `# 제목` 이 공지 제목이 됩니다.
- 파일 이름 앞의 날짜(`YYYY-MM-DD`)로 정렬하고 주소를 만듭니다. 같은 날 두 건이면 주소 뒤에 `-2` 가 붙습니다.
- `_` 로 시작하는 파일은 사이트에 나오지 않습니다.
- `## 소제목` 마다 칸이 하나씩 나뉩니다. 표, 목록, 굵은 글씨, 링크를 쓸 수 있습니다.
- 예전 방식 링크(`g-도전.html`, `items.html`)도 새 주소로 바뀌어 연결됩니다.

## 가이드 수정

`content/guide/NN-이름.md` 를 고칩니다. 파일 이름의 숫자가 목차 순서이고, 숫자 뒤의 영문이 주소입니다(`05-gear.md` 는 `/guide/gear/`).

## 폴더

```
data/            게임 데이터 (YAML). 교체 대상
content/         가이드, 공지 원문 (마크다운)
scripts/         검증, 에셋 생성, 미리보기
src/app/         페이지
src/components/  화면 부품 (ui, 검색, 필터, 판, 배경 씬)
src/lib/         데이터 로더, 검색, 판 배치 계산, 아이콘 도형
src/generated/   빌드 때 만들어지는 파일 (텍스처, 글꼴 서브셋)
public/gen/      빌드 때 만들어지는 아이콘 스프라이트
```

## 배포

`.github/workflows/deploy.yml` 이 `main` push 때마다 빌드해서 GitHub Pages에 올립니다.
저장소 Settings > Pages > Source 는 "GitHub Actions" 여야 합니다.

저장소 이름이 곧 주소 경로입니다(`https://<계정>.github.io/<저장소>/`). 워크플로가 저장소 이름을 `NEXT_PUBLIC_BASE_PATH` 로 넘기므로, 저장소를 옮기거나 이름을 바꿔도 따로 고칠 것은 없습니다.
`<계정>.github.io` 저장소나 자체 도메인처럼 경로 없이 올릴 때는 워크플로의 `NEXT_PUBLIC_BASE_PATH` 를 빈 값으로 바꿉니다.

## 알아 둘 점

- 세트 장비에는 레벨대 값이 없어서, 재료를 떨구는 사냥터를 기준으로 세트의 지역을 추정합니다(`src/lib/data.ts` 의 `regionOfSet`).
- 시련의 탑 층별 보스, 파티 기능, 랭킹 집계 기준은 자료가 없어 "준비 중"으로 표시합니다.
- 글꼴은 사이트에 실제로 나오는 글자만 남겨 줄였습니다. 데이터에 새 글자가 들어오면 빌드 때 자동으로 포함됩니다.
- 라이브러리, 글꼴, 이미지 출처는 [LICENSES.md](LICENSES.md) 에 있습니다.
