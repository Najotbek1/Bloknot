# Maqsad: egasi uchun qo‘llanma

Bu qo‘llanma ilovani Claude yordamisiz ham boshqarish uchun yozilgan. Hamma narsa brauzerda, GitHub sayti orqali qilinadi. Kompyuterga hech narsa o‘rnatish shart emas.

## 1. Yangi APK qayerdan olinadi
1. GitHub → repozitoriya → **Actions** → **Build**.
2. Eng yuqoridagi yashil ✓ belgili ishni oching.
3. Pastdagi **Artifacts** bo‘limida ikkita fayl bor:

| Fayl | Nima uchun |
|---|---|
| `maqsad-apk` | Telefonda sinash uchun. Eski versiya ustiga o‘rnatiladi, ma'lumotlar saqlanadi. |
| `maqsad-release` | Google Play uchun `.aab` fayl va imzolangan `.apk`. |

Artefaktlar 90 kun saqlanadi. Muddati o‘tsa, **Re-run all jobs** bosib yangisini yig‘dirasiz.

**Muhim:** `maqsad-release` ichidagi `.apk` boshqa kalit bilan imzolangan. Shuning uchun u `maqsad-apk` versiyasi ustiga o‘rnatilmaydi. O‘tish tartibi:
1. **Sozlamalar → Eksport** qiling.
2. Eski ilovani o‘chiring.
3. Yangisini o‘rnating.
4. **Import** qiling.

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
- **Xiaomi, Oppo, Vivo, Huawei** telefonlarida ilova sozlamalarida «Batareya cheklovi yo'q» va «Avtoishga tushish»ni yoqing. Aks holda tizim uyg'otgichni kechiktirishi mumkin.

Cheklovlar:
- Telefon o'chiq bo'lsa yoki ilova «Majburan to'xtatish» qilingan bo'lsa, uyg'otgich chalmaydi.
- Ovozni ovoz tugmasi bilan pasaytirish mumkin. Chalish boshlanganda ilova ovozni kamida 70% gacha ko'taradi.
- Uyg'otgich 1 soatdan keyin o'zi to'xtaydi, batareya tugab qolmasligi uchun.

## 6. Maxfiy kalit (juda muhim)
- `maqsad-release.jks` va `release-secrets.txt` fayllari Play'ga yangilanish yuklash uchun kerak. Ularni ikki joyda saqlang va hech kimga bermang.
- Ular GitHub **Secrets**'da ham turibdi (`RELEASE_*`). Secrets'ni o‘chirmang.

## 7. Keyin Claude bilan davom etish
Loyihaning butun konteksti repozitoriyada saqlangan:
- `CLAUDE.md` — qoidalar;
- `docs/REJA.md` — bosqichlar va nima qilingani.

Yangi Claude Code sessiyasini shu repozitoriya bilan oching va masalan quyidagilarni yozing:
- «docs/REJA.md ni o‘qi va keyingi bajarilmagan bosqichni boshla»;
- «AdMob ID'larim tayyor, tekshirib ber»;
- «ilovaga yangi funksiya qo‘sh: …».

Claude oldingi suhbatni ko‘rmaydi. Lekin bu fayllar orqali qayerda to‘xtaganimizni biladi.
