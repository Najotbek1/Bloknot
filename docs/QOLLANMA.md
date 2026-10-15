# Maqsad: egasi uchun qo‘llanma

Bu qo‘llanma ilovani Claude yordamisiz ham boshqarish uchun yozilgan. Hamma narsa brauzerda, GitHub sayti orqali qilinadi. Kompyuterga hech narsa o‘rnatish shart emas.

## 1. Yangi APK qayerdan olinadi
1. GitHub → repozitoriya → **Actions** → **Build**.
2. Eng yuqoridagi yashil ✓ belgili ishni oching.
3. Pastdagi **Artifacts** bo‘limida ikkita fayl bor:

| Fayl | Nima uchun |
|---|---|
| `maqsad-apk` | Faqat o‘zingiz sinash uchun (ochiq «dev» kalit). Boshqalarga tarqatmang. |
| `maqsad-release` | Google Play uchun `.aab` va **Telegram'da tarqatish uchun** imzolangan `.apk`. |

Artefaktlar 90 kun saqlanadi. Muddati o‘tsa, **Re-run all jobs** bosib yangisini yig‘dirasiz.

**Muhim:** `maqsad-release` ichidagi `.apk` boshqa kalit bilan imzolangan. Shuning uchun u `maqsad-apk` versiyasi ustiga o‘rnatilmaydi. O‘tish tartibi:
1. **Sozlamalar → Eksport** qiling.
2. Eski ilovani o‘chiring.
3. Yangisini o‘rnating.
4. **Import** qiling.

## 1b. Kompyuter ilovasi (Windows, Mac, Linux)
1. **Actions → Build** → oxirgi yashil ish → **Artifacts** → `maqsad-windows` ni yuklab oling va zip ichidagi `Maqsad-Setup-….exe` ni oching.
2. Windows «Windows protected your PC» deb ogohlantirishi mumkin, chunki o'rnatuvchi raqamli sertifikat bilan imzolanmagan (u pullik). **More info → Run anyway** bosing.
3. Telefondagi ma'lumotlarni ko'chirish: telefonda **Sozlamalar → Eksport**, faylni kompyuterga yuboring (Telegram, USB), kompyuterda **Sozlamalar → Import**.
4. Oynani yopsangiz, Maqsad ekran burchagidagi tepsida ishlab turadi va eslatmalarni yuboradi. Butunlay chiqish: tepsidagi belgi → o'ng tugma → «Chiqish». Buni xohlamasangiz: **Sozlamalar → Kompyuter → «Yopganda tepsida qolsin»** ni o'chiring, shunda oyna yopilganda ilova to'liq yopiladi (eslatmalar kelmaydi). «Windows bilan birga ochilish» alohida sozlama: kompyuter yoqilganda ilovani o'zi ishga tushiradi.
5. Kompyuter versiyasida reklama yo'q va bo'lmaydi: AdMob faqat telefon uchun.
6. Kompyuterda menyu chap tomonda turadi, ekranlar ikki ustunli bo'ladi. Oyna tor qilinsa, telefondagi ko'rinishga qaytadi. Tezkor tugmalar: `Ctrl+N` — yangi reja yoki yozuv, `Ctrl+1…5` — bo'limlar.

### Microsoft Store
Store versiyasida «xavfli ilova» ogohlantirishi bo'lmaydi va yangilanishlar o'zi keladi. Joylash qadamlari: `docs/msstore/PUBLISH.md` (hisob tekin; Partner Center'dagi 3 ta qiymatni GitHub Variables'ga yozasiz, Actions `maqsad-msstore` ni yig'adi, uni Partner Center'ga yuklaysiz).

### Mac
1. **Artifacts** → `maqsad-mac` ni yuklab oling. Ichida ikkita fayl bor: `…-arm64.dmg` (M1/M2/M3/M4 — Apple Silicon) va `…-x64.dmg` (eski Intel Mac'lar). Mac'ingiz qaysiligini bilish: chap yuqoridagi  → **About This Mac** → «Chip: Apple M…» bo'lsa arm64.
2. `.dmg` ni oching va Maqsad belgisini **Applications** papkasiga sudrang.
3. Birinchi ochishda Mac «Apple tekshira olmadi» deydi, chunki ilova Apple'ning pullik imzosisiz. **Done** bosing, keyin **System Settings → Privacy & Security** → pastda «Maqsad was blocked…» yonidagi **Open Anyway** → parolingiz.
4. Agar «Maqsad is damaged» deb chiqsa: **Terminal**ni oching va `xattr -cr /Applications/Maqsad.app` ni yozib Enter bosing, keyin qayta oching.
5. Oyna yopilganda Maqsad ekran tepasidagi menyu satrida qoladi; to'liq chiqish — Cmd+Q.

### Linux
1. **Artifacts** → `maqsad-linux`: `.AppImage` (hamma distributivlar) va `.deb` (Ubuntu, Debian, Mint).
2. `.deb`: ikki marta bosing va «O'rnatish»; yoki terminalda `sudo apt install ./Maqsad-….deb`.
3. `.AppImage`: fayl ustida o'ng tugma → **Properties → Permissions → «Allow executing file as program»** (yoki `chmod +x Maqsad-….AppImage`), keyin ikki marta bosing. `libfuse2` o'rnatish shart emas: AppImage o'z FUSE'i bilan keladi (`toolsets.appimage` 1.0.3, statik runtime).
4. GNOME'da tepsi belgisi ko'rinmasa, «AppIndicator» kengaytmasini yoqing.

### Telefon va kompyuterni Wi-Fi orqali sinxronlash
1. Telefon va kompyuter **bitta Wi-Fi** tarmog'ida bo'lsin.
2. Kompyuterda: **Sozlamalar → Telefon bilan sinxronlash**. QR kod chiqadi, u 5 daqiqa amal qiladi.
3. Birinchi marta Windows «Firewall» oynasini ko'rsatadi: **Ruxsat berish (Allow access)** bosing. «Private networks» (uy tarmog'i) belgilangan bo'lsin.
4. Telefonda: **Sozlamalar → QR kodni skanerlash** va kompyuterdagi kodni skanerlang. Ikkala tomonda «Tayyor! Qo'shildi: …» chiqadi.

Ishlamasa:
- «Kompyuterga ulanib bo'lmadi» — mehmon yoki ofis Wi-Fi'lari qurilmalarni bir-biridan ajratib qo'yadi. Uy Wi-Fi'sida yoki telefon hotspotiga kompyuterni ulab sinang. Firewall'da ruxsat bermagan bo'lsangiz: Windows qidiruvida «Allow an app through Windows Firewall» → Maqsad → Private belgisini qo'ying.
- «QR skaner yuklanmoqda» — Google Play xizmatlari skanerni birinchi marta yuklayapti, bir daqiqadan keyin qayta urining.
- Har doim zaxira yo'li bor: fayl orqali Eksport/Import.

## 1b. Telegram'dagilarga yangi versiya haqida xabar
Telegram botdan (`https://t.me/OmniViobot`) o'rnatilgan ilova — telefon (APK) ham, kompyuter (Windows o'rnatuvchisi, Mac, Linux) ham — bir necha soatda bir marta saytdagi `version.json` faylini tekshiradi. U yerdagi versiya yangiroq bo'lsa, «Bugun» ekranida **«Yangi versiya chiqdi — Yuklab olish»** yozuvi chiqadi, tugma botni ochadi. Do'kondan (Play, Samsung, Xiaomi, Microsoft Store…) o'rnatilganlarga bu yozuv chiqmaydi, ularni do'konning o'zi yangilaydi.

Yangi versiya chiqarish tartibi:
1. Claude `package.json` dagi versiyani oshiradi (masalan 0.7.0 → 0.8.0). Xabar faqat versiya raqami oshganda chiqadi.
2. PR'dagi build tugagach yangi fayllarni **avval botga** qo'yasiz: `maqsad-release` dagi `.apk`, `maqsad-windows`, `maqsad-mac`, `maqsad-linux`.
3. **Keyin** PR'ni birlashtirasiz: sayt yangilanadi va foydalanuvchilarga xabar boradi.

## 1c. Foydali imkoniyatlar
- **Tartiblash:** reja qatoridagi ⋮⋮ belgini bosib turib yuqoriga yoki pastga suring.
- **Fokus taymer:** rejani oching → **Fokus taymer** → vaqtni tanlang → **Boshlash**. Ekranni yopsangiz ham taymer ishlaydi, tugaganda bildirishnoma keladi.
- **Bir bosishda bajarish:** Sozlamalar → Rejalarni belgilash. O'chirsangiz reja avval «Jarayonda», keyingi bosishda «Bajarildi» bo'ladi. Murabbiy ohangi esa Sozlamalarda o'zingiz yoqmaguncha o'chiq.

## 2. Reklamadan daromad (AdMob)
`docs/ADMOB.md` da qadam-baqadam yozilgan. Qisqasi:
1. AdMob'dan App ID va Banner ID olasiz.
2. GitHub → **Settings → Secrets and variables → Actions → Variables** bo‘limiga `ADMOB_APP_ID`, `ADMOB_BANNER_ID` va `ADMOB_APP_OPEN_ID` ni yozasiz.
3. **Actions → Build → Re-run all jobs** bosasiz.

## 3. Google Play'ga joylash
`docs/play/PUBLISH.md` da qadam-baqadam yozilgan:
- Play Console hisobi (25 $);
- yopiq test (12 tester, 14 kun);
- do'kon sahifasi matnlari va rasmlari (`docs/play/`);
- maxfiylik siyosati havolasi: `https://najotbek1.github.io/Bloknot/privacy.html`.

## 4. Play'ga yangi versiya yuklashdan oldin
Play har safar versiya raqami oshgan bo‘lishini talab qiladi:
- **Ichki raqam** (`versionCode`) har build'da avtomatik oshadi.
- **Ko‘rinadigan raqam**ni (masalan, 1.1.0) o‘zingiz oshirishingiz mumkin:
  1. GitHub'da `package.json` faylini oching.
  2. Qalamcha ✏️ belgisini bosing.
  3. `"version": "1.1.0"` qatoridagi raqamni o‘zgartiring.
  4. **Commit changes** bosing.

## 5. Uyg'otgich ishlamasa
Uyg'otgich «Bugun» ekranidagi ⏰ tugmasi orqali ochiladi. Shu yerdagi ogohlantirishlar qaysi ruxsat yetishmayotganini ko'rsatadi. Ular:
- **Bildirishnomalar** — yoqilgan bo'lishi kerak.
- **Signal va eslatmalar** (Android 12–13) — aniq vaqtda chalish uchun.
- **To'liq ekranli bildirishnomalar** (Android 14+) — qulflangan ekranda ochilish uchun.
- **Boshqa ilovalar ustidan ko'rsatish** — chalayotgan uyg'otgichdan tepaga surib chiqib ketilsa, ekran 1–2 soniyada o'zi qaytadi. Ruxsatsiz ham uyg'otgich to'xtamaydi: tepada «Uyg'otgich hali chalinmoqda» bildirishnomasi tushadi.
- **Xiaomi, Oppo, Vivo, Huawei** telefonlarida ilova sozlamalarida «Batareya cheklovi yo'q» va «Avtoishga tushish»ni yoqing. Aks holda tizim uyg'otgichni kechiktirishi mumkin.

Cheklovlar:
- Telefon o'chiq bo'lsa yoki ilova «Majburan to'xtatish» qilingan bo'lsa, uyg'otgich chalmaydi.
- Ovozni ovoz tugmasi bilan pasaytirish mumkin. Chalish boshlanganda ilova ovozni kamida 70% gacha ko'taradi.
- Uyg'otgich 1 soatdan keyin o'zi to'xtaydi, batareya tugab qolmasligi uchun.

## 6. Maxfiy kalit (juda muhim)
- `maqsad-release.jks` va `release-secrets.txt` fayllari Play'ga yangilanish yuklash uchun kerak. Ularni ikki joyda saqlang va hech kimga bermang.
- Ular GitHub **Secrets**'da ham turibdi (`RELEASE_*`). Secrets'ni o‘chirmang.
- Play'da ilova imzosi uchun ham shu kalit ishlatiladi (`docs/play/PUBLISH.md`, 2-bosqich). Yo‘qolsa Google ham tiklab bera olmaydi va ilovani yangilab bo‘lmaydi.

## 7. Keyin Claude bilan davom etish
Loyihaning butun konteksti repozitoriyada saqlangan:
- `CLAUDE.md` — qoidalar;
- `docs/REJA.md` — bosqichlar va nima qilingani.

Yangi Claude Code sessiyasini shu repozitoriya bilan oching va masalan quyidagilarni yozing:
- «docs/REJA.md ni o‘qi va keyingi bajarilmagan bosqichni boshla»;
- «AdMob ID'larim tayyor, tekshirib ber»;
- «ilovaga yangi funksiya qo‘sh: …».

Claude oldingi suhbatni ko‘rmaydi. Lekin bu fayllar orqali qayerda to‘xtaganimizni biladi.
