# Maqsad

Kundalik, haftalik, oylik, muddatli va muddatsiz rejalarni tartibga soluvchi ilova. Unda eslatmalar, bloknotlar va statistika bor. Barcha ma'lumotlar qurilmaning o'zida saqlanadi, server ishlatilmaydi.

Bitta web kod (React + TypeScript) quyidagi platformalarga chiqariladi:
- **Android**, Capacitor orqali. Do'kon materiallari: [docs/play/](docs/play/PUBLISH.md);
- **Web versiya**, GitHub Pages'da;
- **Desktop** (Electron), 9-bosqichda.

To'liq reja va bosqichlar: [docs/REJA.md](docs/REJA.md)

## APK'ni yuklab olish
1. GitHub'da **Actions** → eng oxirgi muvaffaqiyatli **Build** ishini oching.
2. **Artifacts** bo'limidan yuklab oling:
   - `maqsad-apk`: sinov versiyasi (ochiq dev kalit bilan), telefonda tez sinash uchun;
   - `maqsad-release`: imzolangan `.aab` (Google Play uchun) va `.apk`. Faqat release kaliti GitHub Secrets'ga qo'shilgan bo'lsa chiqadi.
3. Telefonda `.apk` ni oching va "noma'lum manbalardan o'rnatish"ga ruxsat bering.

## Dasturchilar uchun
```bash
npm install
npm run dev            # brauzerda ishga tushirish
npm test               # mantiq testlari (Vitest)
npm run e2e            # brauzer testlari (Playwright, avval npm run build)
npm run lint           # kod tekshiruvi
npm run build          # web build (dist/)
npm run android:sync   # build + android/ ga ko'chirish (APK GitHub Actions'da yig'iladi)
node scripts/render-brand.mjs   # ikonka PNG'larini docs/brand/maqsad-icon.svg dan qayta yasash
```
