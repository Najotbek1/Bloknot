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
2. **App signing: o'z kalitimiz (egasining qarori).** Play'dagi versiya va Telegram'da tarqatiladigan APK bitta kalit bilan imzolanadi. Shunda Telegram'dan o'rnatganlar keyin Play'dan muammosiz yangilanadi (o'chirib qayta o'rnatish shart emas). Birinchi relizni yuklashdan oldin bir marta:
   1. Play Console → ilova → **Test and release → App integrity** (yoki birinchi relizdagi **Play app signing** oynasi) → **Choose signing key / Change app signing key**.
   2. **Export and upload a key from Java keystore** variantini tanlang.
   3. **Download encryption public key** tugmasini bosing. `encryption_public_key.pem` fayli yuklanadi.
   4. Faylni Bloknot (Notepad) bilan oching va **butun matnni** nusxalang (`-----BEGIN PUBLIC KEY-----` dan `-----END PUBLIC KEY-----` gacha).
   5. GitHub → **Settings → Secrets and variables → Actions → Variables → New repository variable**:
      - Name: `PLAY_ENCRYPTION_PUBLIC_KEY`;
      - Value: nusxalangan matn.
      Bu Google'ning ochiq kaliti, sir emas.
   6. GitHub → **Actions → Play signing key → Run workflow**. 1–2 daqiqadan keyin ishni oching → **Artifacts** → `play-signing-key` ni yuklab oling va zip'ni oching.
   7. Ichidagi `maqsad-play-signing-key.zip` faylini Play Console'dagi **Upload private key** maydoniga yuklang → **Save**.
   - Bu fayl Google'ning kaliti bilan shifrlangan: uni faqat Google ocha oladi.
   - **Ogohlantirish:** endi `maqsad-release.jks` va paroli yo'qolsa, ilovani hech qachon yangilab bo'lmaydi (Google tiklab bera olmaydi). Ularni kamida ikki joyda saqlang (6-bo'lim, `docs/QOLLANMA.md`).

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
  - **Uyg'otgich ruxsatlari (1.3.0 dan).** Play quyidagilarni so'raydi:
    - **Exact alarms (`USE_EXACT_ALARM`):** «Ilovada foydalanuvchi o'zi qo'yadigan uyg'otgich bor; u aniq vaqtda chalishi kerak».
    - **Full-screen intent (`USE_FULL_SCREEN_INTENT`):** turi «Alarm». Chalayotgan uyg'otgich qulflangan ekranda ochiladi.
    - **Foreground service (`mediaPlayback`):** «Uyg'otgich ovozi foydalanuvchi matnni yozguncha chalinadi». Play qisqa video so'rashi mumkin. Uni telefonda «Sinab ko'rish» tugmasini bosib, chalishini va matn yozib o'chirishni ekrandan yozib olib tayyorlaysiz.
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

## Telegram orqali tarqatish
- Telegram botga **faqat `maqsad-release` ichidagi `.apk`** ni qo'ying (`maqsad-0.7.0-build….apk`).
- `maqsad-apk` ni tarqatmang: u hammaga ochiq «dev» kalit bilan imzolangan, uni boshqalar ham soxta yangilanish bilan almashtira oladi.
- 2-bosqichdagi o'z kalitimiz tufayli Telegram'dan o'rnatilgan ilova keyin Play'dagi versiya bilan yangilanadi, ma'lumotlar saqlanadi.

## ⚠️ «dev» APK'dan o'tish
`maqsad-apk` (ochiq «dev» kalit) bilan o'rnatilgan ilovani release yoki Play versiyasi ustidan o'rnatib bo'lmaydi: Android ularni boshqa-boshqa ilova deb biladi. O'tish tartibi:
1. Eski ilovada **Sozlamalar → Ma'lumotlar → Eksport qilish**: faylni Telegram'ga saqlang.
2. Eski ilovani o'chiring.
3. Yangisini (Play'dan yoki release APK) o'rnating.
4. **Sozlamalar → Ma'lumotlar → Import qilish**: saqlangan faylni tanlang.
