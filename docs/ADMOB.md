# Reklama (AdMob): o‘zingiz sozlaysiz, kod yozish shart emas

Hozir ilovada Google'ning **sinov** reklamasi turibdi: pastki menyu ustida «Test Ad» yozuvli banner chiqadi. U pul keltirmaydi, faqat reklama to‘g‘ri ulanganini ko‘rsatadi.

Haqiqiy daromad uchun AdMob'dan ikkita ID olasiz va ularni GitHub sozlamalariga yozasiz. Kodga tegish kerak emas.

## 1. AdMob hisobini ochish
1. <https://admob.google.com> saytiga Google hisobingiz bilan kiring va ro‘yxatdan o‘ting. 18 yoshdan katta bo‘lish kerak.
2. **To‘lovlar (Payments)** bo‘limida to‘lov manzilingizni (O‘zbekiston) kiriting va qaysi to‘lov usuli mavjudligini tekshiring.
3. Telefon raqamini tasdiqlashda SMS kelmasa:
   - bir necha soatdan keyin yana urinib ko‘ring;
   - **ovozli qo‘ng‘iroq (Call)** variantini tanlang;
   - boshqa operator raqamini sinang;
   - raqamni xalqaro formatda (`+998…`) yozing.

## 2. Ilovani qo‘shish va App ID olish
1. AdMob'da **Apps → Add app → Android**.
2. «Ilova Google Play'da joylanganmi?» savoliga ilova hali Play'da bo‘lmasa **Yo‘q**, bo‘lsa **Ha** deb javob bering. Nomi: **Maqsad**.
3. Sizga **App ID** beriladi. U `ca-app-pub-1234567890123456~1234567890` ko‘rinishida bo‘ladi, ichida **`~`** belgisi bor.

## 3. Banner reklama bloki va Ad unit ID olish
1. Ilova sahifasida **Ad units → Add ad unit → Banner**. Nomi: «Pastki banner».
2. Sizga **Ad unit ID** beriladi. U `ca-app-pub-1234567890123456/1234567890` ko‘rinishida bo‘ladi, ichida **`/`** belgisi bor.

## 3b. «App open» reklama bloki (ilova ochilganda chiqadigan reklama)
1. Xuddi shu sahifada: **Ad units → Add ad unit → App open**. Nomi: masalan «Ochilish reklamasi».
2. Ad unit ID beriladi, u ham `ca-app-pub-…/…` ko‘rinishida bo‘ladi.

Bu reklama ilovada qattiq cheklangan:
- kuniga ko‘pi bilan 5 marta, orasida kamida 1 soat;
- ilova o‘rnatilgandan keyingi dastlabki 3 kunda chiqmaydi;
- faqat ilova yangidan ochilganda yoki 30 daqiqadan ko‘proq fonda turgach qaytilganda chiqadi;
- uyg‘otgich chalganda, bildirishnomadan kirganda yoki biror oyna ochiq bo‘lsa chiqmaydi.

Haqiqiy ID qo‘yilmaguncha sinov rejimida ishlaydi. Bu rejimda reklama har 2 daqiqada bir marta chiqishi mumkin, shunda uni telefonda sinab ko‘rasiz.

## 4. ID'larni GitHub'ga yozish (eng muhim qadam)
1. GitHub'da repozitoriyani oching: **Settings → Secrets and variables → Actions**.
2. **Variables** yorlig‘iga o‘ting. Bu Secrets emas, uning yonidagi yorliq.
3. **New repository variable** tugmasi bilan ikkita o‘zgaruvchi qo‘shing:

   | Name | Value |
   |---|---|
   | `ADMOB_APP_ID` | `~` belgili App ID |
   | `ADMOB_BANNER_ID` | `/` belgili banner Ad unit ID |
   | `ADMOB_APP_OPEN_ID` | `/` belgili «App open» Ad unit ID (ixtiyoriy) |

4. Nomlar aynan shunday, KATTA harflar bilan yozilishi kerak. Qiymatlarda bo‘sh joy qolmasin.

## 5. Yangi APK yig‘ish
1. **Actions → Build** → eng oxirgi muvaffaqiyatli build'ni oching → yuqori o‘ngdagi **Re-run all jobs** tugmasini bosing.
2. 10–15 daqiqadan keyin Artifacts bo‘limida yangi fayllar paydo bo‘ladi:
   - `maqsad-apk` — telefonda sinash uchun;
   - `maqsad-release` — Google Play uchun `.aab`.
3. Ilovada **Sozlamalar → Reklama** bo‘limidagi «Hozir sinov reklamasi ko‘rsatilmoqda» yozuvi yo‘qolsa, hammasi to‘g‘ri bo‘ldi.

Ikkala qiymat ham berilgandagina haqiqiy reklama yoqiladi. Bittasi yetishmasa, ilova xavfsiz tarzda sinov reklamasida qoladi.

Bu ID'lar sir emas, ular baribir ilova ichida bo‘ladi. Shuning uchun ular Secrets'ga emas, Variables'ga yoziladi.

## 6. `app-ads.txt`
Ilova Play'ga chiqqach, AdMob **app-ads.txt** faylini so‘raydi. Qadamlar `docs/play/PUBLISH.md` ning 7-bandida.

## Muhim ogohlantirishlar
- **O‘z reklamangizni hech qachon bosmang.** Tanishlaringizdan ham bostirmang. AdMob buni firibgarlik deb biladi va hisobni butunlay yopadi.
- Haqiqiy ID qo‘yilgan ilovani o‘z telefoningizda sinayotganda reklamaga qaramang, bosmang. Iloji bo‘lsa, AdMob → **Settings → Test devices** bo‘limiga telefoningizni qo‘shing.
- Yangi hisobda reklama dastlabki kunlarda kam ko‘rsatilishi mumkin. Bu odatiy hol.
- To‘lov daromad chegaraga (odatda 100 $) yetganda oyma-oy keladi.

## Taxminiy daromad
Hisoblash formulasi:

**kunlik faol foydalanuvchilar × kuniga banner ko‘rsatuvlari (~4–6) × 1000 ko‘rsatuv narxi (eCPM) ÷ 1000 × 30**

Banner eCPM taxminan:
- O‘zbekiston va MDH: 0,05–0,3 $;
- AQSh va Yevropa: 0,5–1,5 $.

| Kunlik faol foydalanuvchilar | Taxminiy daromad, oyiga |
|---|---|
| 100 | 1–4 $ |
| 1 000 | 10–40 $ |
| 10 000 | 100–400 $ |

Ikkinchi banner qo‘shish daromadni deyarli oshirmaydi, lekin baholarni yomonlashtiradi. Keyinroq foydaliroq variantlar:
- kamdan-kam chiqadigan to‘liq ekranli reklama (interstitial);
- foydalanuvchi o‘zi tanlab ko‘radigan «rewarded» reklama, masalan maxsus mavzuni ochish uchun.
