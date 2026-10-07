# Bloknot

Kundalik, haftalik, oylik, muddatli va muddatsiz topshiriqlarni tartibga soluvchi ilova. Unda eslatmalar, bloknotlar va statistika bo'ladi.

Bitta web kod (React + TypeScript) quyidagi platformalarga chiqariladi:
- **Android APK**, Capacitor orqali;
- **Web versiya**, GitHub Pages'da;
- **Desktop** (Electron), keyingi bosqichlarda.

Server ishlatilmaydi: barcha ma'lumotlar qurilmaning o'zida saqlanadi.

To'liq reja va bosqichlar: [docs/REJA.md](docs/REJA.md)

## APK'ni yuklab olish
1. GitHub'da **Actions** → eng oxirgi muvaffaqiyatli **Build** ishini oching.
2. Pastdagi **Artifacts** bo'limidan `bloknot-apk` ni yuklab oling (zip ichida `.apk` bor).
3. Telefonda `.apk` ni oching va "noma'lum manbalardan o'rnatish"ga ruxsat bering.

## Dasturchilar uchun
```bash
npm install
npm run dev            # brauzerda ishga tushirish
npm test               # testlar
npm run lint           # kod tekshiruvi
npm run build          # web build (dist/)
npm run android:sync   # build + android/ ga ko'chirish (APK GitHub Actions'da yig'iladi)
```
