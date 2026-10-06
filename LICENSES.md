# 외부 자료와 라이선스

## 라이브러리

| 이름 | 용도 | 라이선스 |
|---|---|---|
| next | 프레임워크, 정적 빌드 | MIT |
| react, react-dom | 화면 | MIT |
| three | 배경 3D 씬 | MIT |
| yaml | `data/*.yml` 읽기 (빌드 때) | ISC |
| marked | 마크다운 읽기 (빌드 때) | MIT |
| subset-font | 글꼴 서브셋 (빌드 때) | BSD-3-Clause |
| pngjs | 텍스처 PNG 생성 (빌드 때) | MIT |
| tsx, typescript | 빌드 도구 | MIT, Apache-2.0 |

## 글꼴

| 이름 | 출처 | 라이선스 |
|---|---|---|
| 갈무리 (Galmuri11, Galmuri11 Bold, Galmuri14, Galmuri9) | https://galmuri.quiple.dev , 눈누 https://noonnu.cc/font_page/801 | SIL Open Font License 1.1 |

npm 패키지 `galmuri` 의 TTF에서 사이트에 쓰는 글자만 남겨 WOFF2로 다시 만들어 씁니다. OFL 1.1은 수정과 재배포를 허용합니다. 라이선스 전문은 `node_modules/galmuri/dist/LICENSE.txt` 에 있습니다.

## 이미지

외부 이미지 파일은 쓰지 않았습니다.

- 블록 텍스처: 마인크래프트의 블록 생김새를 참고해 `scripts/assets.ts` 에서 16x16 칸 단위로 직접 그립니다. Mojang의 원본 텍스처 파일은 들어 있지 않습니다.
- 아이콘: `src/lib/pixel/shapes.ts` 에 16x16 도형으로 직접 그렸습니다. `data` 의 `icon_material` 값은 도형과 색을 고르는 데만 씁니다.
- 배경 3D 씬: 위 텍스처로 직접 쌓은 블록입니다.

## 고지

이 사이트는 마인크래프트 공식 제품이 아니며 Mojang, Microsoft와 관련이 없습니다. 같은 문구를 모든 페이지 아래에 표시합니다.

디자인 참고: minecraft.net 의 화면 구성, Awwwards 수상작 "Yamauchi No.10 Family Office" 의 복셀 배경 연출. 코드와 에셋은 가져오지 않았습니다.
