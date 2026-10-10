# Maqsad (avvalgi nomi «Bloknot»): to'liq loyiha rejasi

## Kontekst
**Maqsad:** foydalanuvchiga kunlik, haftalik va oylik rejalarini, muddatli va muddatsiz maqsadlarini tartibga solishda yordam beradigan ilova yaratish. Ilova doim cho'ntakda turadi va bildirishnomalar orqali eslatib turadi.

**Platformalar:**
- Android APK. Ilova web texnologiyada yoziladi, Capacitor uni APK'ga o'raydi.
- Bepul web versiya (GitHub Pages).
- Keyinroq kompyuter uchun desktop ilova. U shu repozitoriyada, shu kod asosida quriladi.

**Cheklovlar:** server yo'q va pul sarflanmaydi. APK'lar GitHub Actions'da yig'iladi, chunki konteynerda Android SDK yo'q. Node 22 bor.

**Repozitoriya:** `Najotbek1/Bloknot`, ochiq (public).

**Siz bilan kelishilganlar:**
- Takrorlanuvchi topshiriqlar bo'ladi.
- Ilova tili o'zbekcha (lotin). Kod boshqa tillarni keyin oson qo'shadigan qilib yoziladi.
- Web versiya GitHub Pages'da joylanadi: repo ochiq, qo'shimcha hisob ochish shart emas.

## Desktop ilova shu repozitoriyada bo'ladimi?
Ha, tavsiya qilaman. Desktop ilova **Electron** orqali, telefon ilovasi bilan **bir xil web kod** asosida quriladi. Bunga faqat `desktop/` papkasi va GitHub Actions'dagi yana bitta ish qo'shiladi.

**Afzalliklari:**
- Funksiyalar bir marta yoziladi va ikkala ilovada bir xil ishlaydi.
- Ma'lumot formati ham bir xil, shuning uchun fayl almashishda xato chiqmaydi.

Alohida prompt yozish shart bo'lmaydi. Reja bo'yicha desktop eng oxirgi bosqichda qo'shiladi.

## Texnologiyalar
| Qatlam | Tanlov | Nega |
|---|---|---|
| Interfeys | React + TypeScript + Vite | Keng tarqalgan. TypeScript xatolarni yozish paytida ushlaydi, bu keyin funksiya qo'shishda xavfsizlik beradi |
| Saqlash | IndexedDB (Dexie) | Telefonning o'zida saqlanadi, versiyalash va migratsiyani qo'llaydi |
| Holat | `dexie-react-hooks` (`useLiveQuery`) | Baza o'zgarsa ekran o'zi yangilanadi, alohida holat kutubxonasi shart emas |
| Sanalar | date-fns | Haftalar, oylar va takrorlanishni hisoblash uchun |
| Android | Capacitor + `@capacitor/local-notifications`, `filesystem`, `share` | Serversiz eslatmalar va fayl almashish |
| Reklama | `@capacitor-community/admob` | Ilova ichida Google AdMob reklamasi |
| Desktop | Electron + electron-builder | Windows `.exe` uchun |
| Testlar | Vitest (mantiq), Playwright (telefon o'lchamida skrinshot) | Men har bir o'zgarishni sizga yetkazishdan oldin tekshiraman |

## Arxitektura: kelajakdagi o'zgarishlar xato chiqarmasligi uchun
```
src/
  core/        # UI'ga bog'liq bo'lmagan mantiq. Barchasi test bilan qoplanadi
    models/    #   Task, Notebook, Note, Settings turlari
    db/        #   Dexie sxemasi + versiya migratsiyalari
    recurrence/#   takrorlanish qoidalari
    stats/     #   statistika hisob-kitobi
    sync/      #   eksport/import va birlashtirish (merge)
  platform/    # Capacitor / Electron / brauzer farqlari bitta interfeys orqasida
               #   (notifications, files, ads)
  features/    # har bir bo'lim alohida: tasks/, notebooks/, stats/, settings/
  ui/          # umumiy komponentlar, mavzu (yorug'/tungi), ranglar
  i18n/uz.ts   # barcha matnlar shu yerda, keyin ru.ts, en.ts qo'shiladi
```
**Asosiy qoidalar:**
- Har bir yozuvda `id` (UUID), `createdAt`, `updatedAt` va `deletedAt` maydonlari bo'ladi. O'chirilgan yozuv darhol yo'qolmaydi, faqat belgilanadi. Bu sinxronlash uchun shart.
- Ma'lumotlar bazasining har bir o'zgarishi uchun versiya va migratsiya yoziladi. Shunda yangilangan ilovada eski ma'lumotlar yo'qolmaydi.
- Platformaga xos kod faqat `platform/` papkasida turadi. Desktop qo'shilganda faqat shu papka kengayadi.

**Javob:** dizayn, fon va yangi funksiyalarni keyin qo'shish muammo bo'lmaydi. Struktura aynan shunga mo'ljallangan.

## Ma'lumotlar modeli
- **Task**:
  - `title`, `notes`
  - `kind`: `daily` | `weekly` | `monthly` | `range` | `general`
  - `date` / `weekStart` / `month`; `range` turi uchun `startDate`, `endDate`
  - `status`: `todo` | `in_progress` | `done` | `skipped`
  - `priority`, `reminders[]`, `recurrence?`, `completedAt`, `notebookId?`
- **TaskOccurrence**: takrorlanuvchi topshiriqning har bir kunlik bajarilish holati. Statistika shu ma'lumotdan hisoblanadi.
- **Notebook** (`title`, `color`) → **Note** (`notebookId`, `title`, `body`, `taskId?`). Eslatmani topshiriqqa bog'lash mumkin bo'ladi.
- **Settings**: mavzu, eslatma vaqtlari (ertalabki reja, kechki xulosa), til.

## Telefon ↔ kompyuter almashinuvi (serversiz)
1. **Fayl orqali (APK bosqichida):** "Eksport" tugmasi barcha ma'lumotni `.bloknot` (JSON) fayliga yozadi. Faylni Telegram, Google Drive yoki USB orqali yuborasiz. Ikkinchi qurilmada "Import" bosiladi.
2. **Aqlli birlashtirish:** import ma'lumotlarni o'chirib qayta yozmaydi. Har bir yozuv `id` va `updatedAt` bo'yicha solishtiriladi va eng oxirgi o'zgarish saqlanadi. Shunda ikkala qurilmada qilingan o'zgarishlar ham saqlanib qoladi.
3. **Wi-Fi orqali (desktop bosqichida):** desktop ilova uydagi Wi-Fi tarmog'ida QR kod ko'rsatadi. Telefon uni skanerlab, ma'lumotlarni bir tugma bilan sinxronlaydi. Internet ham, server ham kerak emas.

## Reklama (AdMob)
**Qanday ishlaydi:** server kerak emas. AdMob kutubxonasi telefonda internet yoqilganda reklamani Google'dan o'zi oladi, daromad AdMob hisobingizga tushadi.

**Sizdan talab qilinadi:**
- AdMob hisobi (bepul, 18 yoshdan katta bo'lish kerak).
- To'lov ma'lumotlari.
- Keyinchalik Google Play'ga joylash (Play Console bir martalik $25 turadi). Pulni to'liq yechib olish uchun ilova odatda do'konga bog'lanishi kerak.

Uzbekistonga to'lov qilinishini reklama bosqichida birga tekshiramiz.

**Joylashuv:** reklama faqat pastki banner bo'ladi va ish jarayoniga xalaqit bermaydi. Ishlab chiqishda Google'ning sinov ID'lari ishlatiladi. Desktop va web versiyada reklama bo'lmaydi, AdMob faqat telefon uchun.

## Bosqichlar
Har bir bosqich oxirida: kod push qilinadi, GitHub Actions APK yig'adi, siz telefonda sinab ko'rasiz.

0. **Poydevor.** ✅ bajarildi
   - Vite, React, TS, lint, Vitest va Capacitor sozlanadi.
   - GitHub Actions ikki ish bajaradi: testlar + web build → GitHub Pages, va APK yig'ish → yuklab olinadigan fayl.
   - Ishlab chiqish davrida APK repozitoriyadagi ochiq `bloknot-dev.keystore` kaliti bilan imzolanadi. Shunda har yangi APK eskisining ustiga o'rnatiladi. Google Play uchun maxfiy kalit 8-bosqichda GitHub Secrets'ga qo'shiladi.
   - Natija: telefonga o'rnatiladigan bo'sh ilova.
1. **Ma'lumotlar qatlami.** ✅ bajarildi. Modellar, Dexie sxemasi, migratsiya va takrorlanish mantig'i, hammasi testlar bilan (`src/core/`).
2. **Topshiriqlar interfeysi.** ✅ bajarildi
   - Pastki menyu: Bugun | Reja | Bloknot | Statistika | Sozlamalar.
   - "Reja" ichida tablar: Kun / Hafta / Oy / Muddatli / Umumiy.
   - Topshiriq qo'shish, tahrirlash, holatini o'zgartirish, doirachani bosib bajarildi deb belgilash. Surish (swipe) imo-ishorasi keyinroq, telefonda sinalgandan so'ng qo'shiladi.
   - Yorug' va tungi mavzu (Sozlamalar → Mavzu).
   - Ekranlar ma'lumotlar bazasidagi o'zgarishlarni avtomatik ko'rsatadi (`dexie-react-hooks`); shuning uchun Zustand kerak bo'lmadi.
3. **Bildirishnomalar.** ✅ bajarildi
   - Har bir rejaning o'z eslatmalari (vaqt + "o'sha kuni / N kun oldin"); eslatmada «Bajarildi» tugmasi.
   - Ertalab kunlik reja, kechqurun "nimalar qoldi" xulosasi (Sozlamalarda yoqish/o'chirish, vaqtini o'zgartirish).
   - Muddatli reja tugashidan 1 kun oldin va oxirgi kuni ogohlantirish.
   - Har bir o'zgarishdan keyin keyingi 30 kunlik bildirishnomalar qaytadan rejalashtiriladi (`src/core/reminders/plan.ts`).
   - Tuzatildi (0.3.1): Android 16 da "Bugun"dan boshqa bo'limga o'tganda ilova oq ekranda qotib qolardi. Sabab: yangi WebView'da `window.scrollTo()` Promise qaytaradi, React esa uni effekt tozalash funksiyasi deb chaqirgan. Endi xato bo'lsa, oq ekran o'rniga xato oynasi chiqadi; `e2e/` testlari yangi WebView'ni ham emulyatsiya qiladi.
   - Tuzatildi: reja oynasi "orqaga" tugmasi, tashqariga bosish yoki ✕ bilan yopilganda yozilgan reja jimgina yo'qolardi. Endi oyna tasdiq so'raydi, «Saqlash» doim ko'rinadi, har saqlashdan keyin xabar chiqadi.
4. **Bloknotlar.** ✅ bajarildi (0.4.0)
   - Bloknotlar ro'yxati (rang, yozuvlar soni, oxirgi o'zgarish), yaratish, tahrirlash, o'chirish (yozuvlari bilan).
   - Yozuvlar avtomatik saqlanadi; bo'sh qolgan yangi yozuv o'chiriladi.
   - Barcha yozuvlar bo'yicha qidiruv (o‘/o'/oʻ farqsiz).
   - Yozuvni rejaga bog'lash; reja oynasida "Yozuvlar" bo'limi va "+ Yozuv qo'shish" ("Umumiy" bloknotiga).
5. **Statistika.** ✅ bajarildi (0.5.0)
   - Mas'uliyat bali (0–100) = 50% bajarilish + 30% muddatida bajarish + 20% faol kunlar ulushi.
   - 7/30 kunlik davr: bajarilish foizi, muddatida bajarilganlar, faol kunlar, ketma-ketlik (joriy va eng uzun).
   - Kunlar bo'yicha ustunli grafik (rejada / bajarilgan), 12 haftalik faollik kalendari, turlar bo'yicha, jadval ko'rinishi.
   - Hisob-kitob `src/core/stats/` da, testlar bilan.
6. **Eksport, import va birlashtirish.** ✅ bajarildi (0.6.0)
   - Sozlamalar → Ma'lumotlar: «Eksport qilish» `.bloknot` (JSON) faylini yaratib Android ulashish oynasini ochadi (brauzerda yuklab olinadi); «Import qilish» faylni tanlab, ichidagini ko'rsatadi va birlashtiradi.
   - Birlashtirish: har bir yozuv `id` bo'yicha, `updatedAt` kattasi yutadi; o'chirishlar ham tarqaladi; takrorlanish kunlari `taskId + sana` bo'yicha dublikatsiz. Bitta tranzaksiyada (`src/core/sync/`).
   - Fayl formati `version: 1`; desktop ilova (9-bosqich) ham shu formatni ishlatadi.
7. **Reklama.** ✅ bajarildi (0.7.0) — sinov ID'lari bilan
   - Pastki menyu ustida bitta adaptiv AdMob banner (`@capacitor-community/admob`); oyna ochiq bo'lsa, yozuv yozilayotganda va klaviatura ochiq bo'lsa yashiriladi (`src/features/ads/`).
   - Rozilik (UMP) va Sozlamalar → Reklama maxfiylik tugmasi.
   - Haqiqiy ID'larni egasi o'zi GitHub Variables'ga (`ADMOB_APP_ID`, `ADMOB_BANNER_ID`) yozadi, kod tahrirlamasdan: `docs/ADMOB.md`. ⏳ AdMob hisobi ochilishi kutilmoqda (telefon raqamini tasdiqlash muammosi).
8. **Pardoz va Google Play'ga tayyorgarlik.** ✅ bajarildi (1.0.0)
   - Ilova nomi **«Maqsad»** (do'konda «Maqsad — reja va bloknot»). `applicationId` (`uz.najotbek.bloknot`) o'zgarmaydi, aks holda ma'lumotlar yangi ilovaga o'tmaydi.
   - Ikonka: qora fonda «M» va yuqoriga ko'rsatkich (`docs/brand/maqsad-icon.svg`), adaptive + monoxrom, ochilish ekrani va bildirishnoma ikonkasi.
   - Release imzosi: maxfiy kalit faqat GitHub Secrets'da; CI `maqsad-release` (AAB + APK) yig'adi.
   - Play materiallari `docs/play/`: maxfiylik siyosati, do'kon matnlari, Data safety javoblari, skrinshotlar, joylash qo'llanmasi.
   - ✅ Secrets qo'shildi, AAB yig'ilyapti; maxfiylik siyosati emaili: contact.najotbek@gmail.com.
   - ⏳ Foydalanuvchi qiladi: `main`ga birlashtirish + Pages, Play Console hisobi va yopiq test, AdMob ID'lari. Hammasi `docs/QOLLANMA.md` da.
8.5. **Yangi dizayn, mavzular, Kalendar.** ✅ bajarildi (1.1.0)
   - Zamonaviyroq, soddaroq ko'rinish: yumaloq kartochkalar, «pill» tugmalar, faol bo'lim aksent rangda.
   - 6 ta mavzu: Telefon bo'yicha, Yorug', Tungi, Tim qora (AMOLED), Pushti, Sariq-qora. Tokenlar `src/ui/theme.css` da; Sozlamalarda har mavzu o'z ranglarida ko'rsatiladi (`[data-preview]`).
   - «Reja» bo'limi endi «Kalendar». Sozlamalar → «Rejalarni ko'rish usuli»: **Kalendar** (oy jadvali, kunda nuqtalar, kunni bosganda rejalari; Muddatli va Umumiy yorliqlari) yoki **Ro'yxat** (avvalgi Kun/Hafta/Oy/Muddatli/Umumiy). Mantiq `src/core/calendar.ts`.
   - AdMob ID'lari GitHub Variables orqali (yuqoridagi 7-bosqich).
9. **Desktop** → 13-bosqichga ko'chirildi (foydalanuvchi avval yangi imkoniyatlarni so'radi).
10. **Kun eslatmalari, statistika, murabbiy.** ✅ bajarildi (1.2.0)
   - Kalendarda tanlangan kunga eslatma: «Kun davomida 3 marta» (09:00, 14:00, 20:00) yoki belgilangan vaqtda. Kalendar katagida 🔔, «Bugun»da ham ko'rinadi. Yangi `dayReminders` jadvali (Dexie v2), eksport/importga kiradi.
   - Statistika tuzatildi: bugungi hali bajarilmagan rejalar «kutilmoqda» (foizni tushirmaydi); faollik ilova ishlatila boshlagan kundan hisoblanadi. Yangi: oldingi davr bilan solishtirish, hafta kunlari, kunning qaysi vaqtida bajarilishi, kechikkan rejalar.
   - Murabbiy (`src/core/coach.ts`): so'nggi 7 kunlik ball < 50 — qattiq (haqoratsiz), 50–70 — oddiy, > 70 — ruhlantiruvchi. Sozlamalar → Murabbiy, Statistikada joriy holat.
11. **Uyg'otgich.** ✅ bajarildi (1.3.0)
   - «Bugun» ekranidagi ⏰ tugmasi: keyingi uyg'otgich vaqti va ro'yxat. Vaqt, hafta kunlari (bo'sh bo'lsa bir marta), nom, matn uzunligi, telefondagi signal tanlanadi.
   - Chalganda butun ekranni egallaydi; matn to'g'ri yozilmaguncha (katta-kichik harf, tinish belgilari va apostrof shakli hisobga olinmaydi) musiqa o'chmaydi. «Keyinroq» tugmasi yo'q (egasining qarori).
   - Native plagin `android/app/src/main/java/uz/najotbek/bloknot/alarm/`: `AlarmManager.setAlarmClock`, foreground `AlarmService` (takroriy ovoz, tebranish, ovozni ≥70%, 1 soatlik chegara), full-screen intent, qayta yoqilganda tiklash. JS ko'prigi `src/platform/alarm.ts`, mantiq `src/core/alarms/`, Dexie v3 `alarms` jadvali.
12. **Tillar.** ✅ bajarildi (1.4.0)
   - O'zbek, ingliz, rus, nemis, yapon, koreys, hind va arab tillari. Til telefon tilidan olinadi (bizda bo'lmasa — o'zbekcha) va Sozlamalar → Til orqali tanlanadi.
   - Matnlar `src/i18n/<til>.ts`, ko'plik shakllari (`{count, plural, …}`), sanalar va hafta kunlari Intl orqali. Murabbiy iboralari, bildirishnomalar va uyg'otgich matnlari ham tarjima qilingan.
   - Arab tili uchun o'ngdan chapga (RTL) joylashuv.
12.5. **App Open reklama.** ✅ bajarildi (1.5.0). Ilova ochilganda butun ekranli reklama: kuniga ko'pi bilan 1 marta, o'rnatilgandan 3 kun o'tgach, faqat yangidan ochilganda yoki 30 daqiqadan keyin qaytganda; uyg'otgich, bildirishnoma yoki ochiq oyna ustiga chiqmaydi. ID — GitHub Variables'dagi `ADMOB_APP_OPEN_ID`.
13. **Desktop** (avvalgi 9-bosqich, keyinga surildi). Electron (`desktop/`), Windows `.exe` Actions orqali yig'iladi, Wi-Fi + QR sinxronlash.

## Tekshirish (har bosqichda)
- `npm test`: mantiqiy testlar (sinxronlash, takrorlanish, statistika).
- `npm run build` va `npm run lint`.
- Playwright bilan 390×844 (telefon) o'lchamida skrinshotlar. Kerak bo'lsa ularni sizga ham yuboraman.
- GitHub Actions'da APK muvaffaqiyatli yig'ilishi. Uni Actions → Artifacts bo'limidan yuklab olib, telefonda sinaysiz.

## Sizdan kerak bo'ladigan narsalar
- **0-bosqich:** GitHub sozlamalarida Pages'ni yoqish (Settings → Pages → Source: GitHub Actions).
- **8-bosqich:** Google Play uchun maxfiy imzolash kalitini Secrets'ga qo'shish.
- **7-bosqich:** AdMob hisobi va ID'larni GitHub Variables'ga yozish (`docs/ADMOB.md`).
- Har bosqichdan keyin APK'ni sinab, fikringizni aytish.
