# DB10 — Auto-update dari gambar INSAIT JOY (Jalur B)

Cukup unggah screenshot sesi ke folder `sessions/` di GitHub. Sebuah GitHub Action
membaca gambar, mengubahnya menjadi `data/latest-session.json`, lalu membuka Pull Request
untuk Anda cek. Begitu PR di-merge, Netlify otomatis men-deploy ulang.

```
Upload gambar  ->  Action (vision -> JSON)  ->  Pull Request (Anda cek)  ->  Merge  ->  Netlify deploy
```

## Isi paket
- `index.html`, `success.html`, `_headers`, `assets/` — website (blok "Latest session" membaca JSON).
- `data/latest-session.json` — data sesi terakhir yang ditampilkan website.
- `sessions/` — taruh screenshot INSAIT JOY di sini (sudah ada contoh `2026-05-17.png`).
- `scripts/extract-session.mjs` — pengubah gambar -> JSON.
- `.github/workflows/update-session.yml` — otomasi GitHub Action.

## Sekali setup

### 1) Push ke GitHub
Buat repo baru (mis. `db10-website`) lalu unggah semua isi paket ini ke branch `main`.

### 2) Hubungkan website yang sudah ada (diptabudiman.netlify.app) ke repo
Agar URL tetap sama, tautkan site lama ke repo, jangan buat site baru:
1. Netlify -> pilih site `diptabudiman`.
2. Site configuration -> Build & deploy -> Continuous deployment -> **Link repository**.
3. Pilih repo GitHub Anda. Build command: **kosongkan**. Publish directory: **`.`** (root).
4. Save. Mulai sekarang setiap commit ke `main` men-deploy ulang otomatis.

(Jika site lama tidak bisa ditautkan, buat site baru dari repo lalu ganti namanya menjadi
`diptabudiman` di Domain settings sehingga URL kembali `diptabudiman.netlify.app`.)

### 3) Simpan API key sebagai secret GitHub
Repo -> Settings -> Secrets and variables -> Actions -> **New repository secret**:
- Name: `ANTHROPIC_API_KEY`
- Value: API key Anda.

### 4) Izinkan Action membuat Pull Request
Repo -> Settings -> Actions -> General -> Workflow permissions:
- pilih **Read and write permissions**, dan
- centang **Allow GitHub Actions to create and approve pull requests**. Save.

## Pemakaian rutin (cukup ini setiap selesai sesi)
1. Buka repo di GitHub (bisa dari HP) -> folder `sessions/`.
2. **Add file -> Upload files** -> pilih screenshot INSAIT JOY (mis. `2026-06-01.png`)
   -> Commit langsung ke `main`.
3. Action berjalan (tab **Actions**), lalu muncul **Pull Request** "Update latest session".
4. Buka PR -> lihat diff `data/latest-session.json`, cocokkan angkanya dengan screenshot.
   - Benar? **Merge** -> Netlify deploy -> website terupdate.
   - Ada yang salah baca? Edit angka di PR (atau file JSON) lalu merge.

## Catatan
- Model default `claude-sonnet-4-6` (ubah di workflow bila perlu; harga per gambar kecil,
  tetap cek harga terbaru karena bisa berubah).
- Hanya blok "Latest session" yang ikut otomatis. Bagian "Personal records (best vs average)"
  diisi manual karena berasal dari layar INSAIT yang berbeda.
- Form kontak tetap memakai Netlify Forms (muncul di dashboard setelah deploy pertama).
- Langkah PR adalah langkah konfirmasi Anda. Jika ingin tanpa konfirmasi (commit langsung),
  ganti langkah PR dengan action `stefanzweifel/git-auto-commit-action` di workflow.

## Pratinjau lokal
```
python3 -m http.server 8080   ->   http://localhost:8080
```
(Lewat `file://` data JSON tidak akan ter-fetch karena aturan browser; pakai server lokal
atau langsung di Netlify.)
