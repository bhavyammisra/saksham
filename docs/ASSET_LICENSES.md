# Asset licences

Every font, image, sound and other asset shipped with the app, with its licence. Only licences that allow bundling are used: SIL OFL, MIT, CC0, or CC BY with credit. Nothing loads from a CDN at runtime.

Owner: confirm each entry (BUILD_PLAN §13). Mark it ✅ once checked.

| Asset | Where it comes from | Licence | Credit required | Used for | Owner check |
| --- | --- | --- | --- | --- | --- |
| Noto Serif (variable) | npm `@fontsource-variable/noto-serif` 5.3.0, from [notofonts/latin-greek-cyrillic](https://github.com/notofonts/latin-greek-cyrillic) | SIL OFL 1.1 (licence file in the package) | No (keep the licence with the font) | All Latin text | ⬜ |
| Noto Serif Devanagari (variable) | npm `@fontsource-variable/noto-serif-devanagari` 5.3.0, from [notofonts/devanagari](https://github.com/notofonts/devanagari) | SIL OFL 1.1 (licence file in the package) | No (keep the licence with the font) | All Hindi text | ⬜ |
| Inter (variable) | npm `@fontsource-variable/inter` 5.3.0, from [rsms/inter](https://github.com/rsms/inter) | SIL OFL 1.1 (licence file in the package) | No (keep the licence with the font) | Menus and forms on the cover screens (D-034) | ⬜ |
| `public/favicon.svg` | Made for this project | Project's own | No | Browser tab icon | ⬜ |

Code dependencies (npm packages) are not assets. Each one's licence is in `node_modules/<package>/LICENSE`, and each is listed with its reason in `DECISIONS.md`.
