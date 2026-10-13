# Microsoft Store'ga joylash (qadam-baqadam)

Store'dagi Maqsad'ni **Microsoft o'zi imzolaydi**: «Windows protected your PC» / «xavfli ilova» ogohlantirishi bo'lmaydi, yangilanishlar avtomatik keladi. Shaxsiy dasturchi uchun hisob **tekin**.

## 1. Hisob ochish (bir marta)
1. <https://storedeveloper.microsoft.com> → **Get started** → Microsoft hisobingiz bilan kiring.
2. Hisob turi: **Individual** (shaxsiy). Mamlakat: O'zbekiston.
3. Shaxsingizni tasdiqlang (pasport yoki ID karta + selfi). Bu bir necha soatdan bir necha kungacha davom etadi.

## 2. Nomni band qilish
1. <https://partner.microsoft.com/dashboard> → **Apps and games** → **+ New product** → **MSIX or PWA app**.
2. Nomi: **Maqsad** → **Reserve product name**. Band bo'lmasa: «Maqsad — reja va bloknot».

## 3. Uchta qiymatni GitHub'ga yozish (eng muhim qadam)
1. Partner Center → ilovangiz → **Product management → Product identity**. U yerda uchta qator bor:
   | Partner Center'da | GitHub Variables nomi | Misol |
   |---|---|---|
   | **Package/Identity/Name** | `MSSTORE_IDENTITY_NAME` | `12345Najotbek.Maqsad` |
   | **Package/Identity/Publisher** | `MSSTORE_PUBLISHER` | `CN=1A2B3C4D-…` |
   | **Package/Properties/PublisherDisplayName** | `MSSTORE_PUBLISHER_NAME` | `Najotbek` |
2. GitHub → repozitoriya → **Settings → Secrets and variables → Actions → Variables** → **New repository variable** — uchtasini aynan shunday nom bilan, qiymatni nusxalab qo'ying (bo'sh joysiz).
3. **Actions → Build** → oxirgi ish → **Re-run all jobs**. 10–15 daqiqadan keyin Artifacts'da **`maqsad-msstore`** paydo bo'ladi — ichida `Maqsad-Store-….appx`.

Bu qiymatlar sir emas (ular har bir o'rnatilgan ilovada ko'rinadi), shuning uchun Secrets emas, Variables.

## 4. Ariza (Submission) to'ldirish
Partner Center → ilova → **Start your submission**:
1. **Pricing and availability:** Markets — hammasi; Pricing — **Free**; Visibility — Public.
2. **Properties:** Category — **Productivity**; Privacy policy URL — `https://najotbek1.github.io/Bloknot/privacy.html`; Support contact — `contact.najotbek@gmail.com`. «Does your product access, collect or transmit personal information?» — **No** (ma'lumotlar faqat kompyuterda; Wi-Fi sinxron faqat foydalanuvchining o'z telefoni bilan).
3. **Age ratings:** IARC so'rovnomasi — hammasiga «Yo'q» (zo'ravonlik, chat, xarid yo'q) → odatda **3+ / Everyone**.
4. **Packages:** `maqsad-msstore` ichidagi `.appx` faylni sudrab tashlang. Device family: **Desktop** belgilangan bo'lsin.
5. **Store listings:** tillarni qo'shing (o'zbek bo'lmasa — English asosiy, Русский qo'shimcha). Matnlar: `docs/msstore/LISTING.md`. Skrinshotlar: `docs/msstore/screenshots/` (1366×768, kamida bittasi). Logo: `docs/play/icon-512.png` (300×300 dan katta bo'lishi kifoya).
6. **Submit to the Store.** Tekshiruv odatda **1–3 kun**. Natija emailga keladi.

## 5. Keyingi yangilanishlar
`package.json` dagi versiya oshganda Actions yangi `.appx` yig'adi. Partner Center → **Update** (yangi submission) → Packages'ga yangi `.appx` → Submit. Store versiyasi har safar oldingisidan katta bo'lishi kerak (bizda avtomatik shunday).

## Bilish kerak
- **Ma'lumotlar alohida:** Store versiyasi oddiy `.exe` versiyadan alohida papkada ishlaydi. O'tishda: eski versiyada **Sozlamalar → Eksport**, Store versiyasida **Import** (yoki telefondan Wi-Fi sinxron). Keyin eski versiyani o'chirsangiz bo'ladi.
- **Windows bilan birga ochilish:** Store ilovasi o'zini avtomatik ishga tushirishga qo'sha olmaydi — **Windows sozlamalari → Ilovalar → Ishga tushirish (Startup)** dan Maqsad'ni yoqasiz. Ilova Sozlamalarida ham shu yozilgan.
- Rad etilsa — emaildagi sababni menga yuboring, tuzatamiz.
