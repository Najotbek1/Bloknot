# Bloknot: to'liq loyiha rejasi

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
| Holat | Zustand | Sodda va yengil |
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
2. **Topshiriqlar interfeysi.**
   - Pastki menyu: Bugun | Reja | Bloknot | Statistika | Sozlamalar.
   - "Reja" ichida tablar: Kun / Hafta / Oy / Muddatli / Umumiy.
   - Topshiriq qo'shish, tahrirlash, holatini o'zgartirish va surish bilan bajarildi deb belgilash.
   - Yorug' va tungi mavzu.
3. **Bildirishnomalar.**
   - Har bir topshiriqning o'z eslatmasi.
   - Ertalab kunlik reja, kechqurun "nimalar qoldi" xulosasi.
   - Muddati yaqinlashgan topshiriqlar haqida ogohlantirish.
4. **Bloknotlar.** Bloknotlar ro'yxati, bloknot ichidagi yozuvlar, qidiruv, topshiriqqa bog'lash.
5. **Statistika.** Quyidagilar hisoblanadi:
   - Bajarilish foizi (kun, hafta, oy).
   - Ketma-ket faol kunlar soni.
   - Muddatida bajarilganlar foizi.
   - Faollik kalendari (heatmap).
   - Umumiy "mas'uliyat bali" (0–100).
6. **Eksport, import va birlashtirish.** `.bloknot` fayli, ulashish tugmasi, birlashtirish natijasi haqida hisobot.
7. **Reklama.** AdMob banner (sinov ID bilan), sozlash bo'yicha qo'llanma.
8. **Pardoz.** Ilova ikonkasi, splash ekran, animatsiyalar, nomlanishni tekshirish, imzolangan release APK.
9. **Desktop.** Electron (`desktop/`), Windows `.exe` Actions orqali yig'iladi, Wi-Fi + QR sinxronlash.

## Tekshirish (har bosqichda)
- `npm test`: mantiqiy testlar (sinxronlash, takrorlanish, statistika).
- `npm run build` va `npm run lint`.
- Playwright bilan 390×844 (telefon) o'lchamida skrinshotlar. Kerak bo'lsa ularni sizga ham yuboraman.
- GitHub Actions'da APK muvaffaqiyatli yig'ilishi. Uni Actions → Artifacts bo'limidan yuklab olib, telefonda sinaysiz.

## Sizdan kerak bo'ladigan narsalar
- **0-bosqich:** GitHub sozlamalarida Pages'ni yoqish (Settings → Pages → Source: GitHub Actions).
- **8-bosqich:** Google Play uchun maxfiy imzolash kalitini Secrets'ga qo'shish.
- **7-bosqich:** AdMob hisobi.
- Har bosqichdan keyin APK'ni sinab, fikringizni aytish.
