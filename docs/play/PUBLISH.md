# Maqsad'ni Google Play'ga joylash: qadam-baqadam

## 0. Tayyor bo'lishi kerak bo'lgan narsalar
- [ ] **Release imzo kaliti GitHub Secrets'da** (`RELEASE_KEYSTORE_BASE64`, `RELEASE_KEYSTORE_PASSWORD`, `RELEASE_KEY_ALIAS`, `RELEASE_KEY_PASSWORD`). Shundan keyin har push'da GitHub Actions → **Build** → Artifacts → `maqsad-release` ichida `.aab` (Play uchun) va imzolangan `.apk` paydo bo'ladi.
- [ ] **Maxfiylik siyosati ochiq URL'da:** kod `main` branchga birlashtiriladi va Settings → Pages → Source: **GitHub Actions** yoqiladi. Natija: `https://najotbek1.github.io/Bloknot/privacy.html`. Aloqa email'i: contact.najotbek@gmail.com.
- [ ] **Haqiqiy AdMob ID'lari** GitHub Variables'da (`docs/ADMOB.md`). Sinov reklamasi bilan ham joylash mumkin, lekin daromad bo'lmaydi.

## 1. Play Console hisobi
1. <https://play.google.com/console> → **Shaxsiy (Personal)** hisob ochiladi. Bir martalik **25 $** to'lov va shaxsni tasdiqlash (pasport) talab qilinadi.
2. Tasdiqlash bir necha kun olishi mumkin.

## 2. Ilova yaratish
1. **Create app** → nomi `Maqsad — reja va bloknot`, til: o'zbek, turi: App, bepul.
2. **App signing:** Google Play App Signing yoqilgan holda qoldiriladi. Bizning kalitimiz **upload key** bo'ladi. U yo'qolsa, Play Console orqali yangisini tiklash mumkin.

## 3. Yopiq test (shaxsiy hisoblar uchun majburiy)
Yangi shaxsiy hisoblar ilovani hammaga ochishdan oldin **yopiq testdan** o'tishi kerak. Odatda talab: **kamida 12 nafar tester 14 kun davomida** testda qatnashishi. Aniq shartlarni Play Console'ning o'zi ko'rsatadi.
1. **Testing → Closed testing → Create track**.
2. Testerlar: 12+ kishining Gmail manzillari (do'stlar, oila).
3. **Create release** → `maqsad-release` artefaktidagi `.aab` faylini yuklang → izoh: «Birinchi versiya».
4. Testerlarga taklif havolasini yuboring. Ular havola orqali qo'shilib, ilovani Play'dan o'rnatishadi va 14 kun davomida o'rnatilgan holda qoldirishadi.

## 4. Do'kon sahifasi va deklaratsiyalar
- **Store listing:** matnlar `docs/play/LISTING.md`da, grafikalar `docs/play/` papkasida.
- **App content:**
  - **Privacy policy:** URL (0-bosqichdan).
  - **Ads:** Ha.
  - **Data safety:** javoblar `docs/play/DATA_SAFETY.md`da.
  - **Content rating:** anketani to'ldiring. Zo'ravonlik va boshqa nomaqbul kontent yo'q, natija odatda «3+ / Everyone».
  - **Target audience:** 13+.
  - **Advertising ID:** Ha, reklama uchun.
- **Mamlakatlar:** Uzbekiston va xohlagan boshqa mamlakatlar.

## 5. Production
Yopiq test shartlari bajarilgach, **Production → Apply for production** orqali ariza beriladi. Google ko'rib chiqadi, odatda bir necha kun. Shundan so'ng ilova hammaga ochiladi.

## 6. Har bir yangi versiya
1. Kodda `package.json` → `version` oshiriladi (buni men qilaman).
2. GitHub Actions'dagi `maqsad-release` artefaktidan yangi `.aab` olinadi. `versionCode` avtomatik oshadi.
3. Play Console → kerakli track → **Create release** → `.aab` yuklanadi.

## 7. AdMob uchun `app-ads.txt` (keyinroq)
AdMob reklamalari to'liq ishlashi uchun dasturchi saytining **ildizida** `app-ads.txt` turishi kerak. Saytni Play'dagi «Website» maydoniga yozasiz.
- Eng oson yo'l: GitHub'da `Najotbek1.github.io` nomli alohida repozitoriya ochish. Unga `app-ads.txt` qo'yiladi, manzili `https://najotbek1.github.io/app-ads.txt`.
- Fayl mazmunini AdMob → Apps → app-ads.txt bo'limi beradi. Buni ham birga qilishimiz mumkin.

## ⚠️ Telefoningizdagi ilova haqida
Hozir telefoningizdagi ilova ochiq «dev» kalit bilan imzolangan. Play'dan yoki release APK'dan o'rnatiladigan versiya **boshqa kalit** bilan imzolanadi. Android ularni bir ilova deb hisoblamaydi va ustiga o'rnatmaydi. O'tish tartibi:
1. Eski ilovada **Sozlamalar → Ma'lumotlar → Eksport qilish**: faylni Telegram'ga saqlang.
2. Eski ilovani o'chiring.
3. Yangisini (Play'dan yoki release APK) o'rnating.
4. **Sozlamalar → Ma'lumotlar → Import qilish**: saqlangan faylni tanlang.
