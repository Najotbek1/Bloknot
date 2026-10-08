# Reklama (AdMob) — sozlash qo‘llanmasi

Ilovada hozir Google'ning **sinov** reklamasi ishlaydi: pastki menyu ustida «Test Ad» yozuvli banner chiqadi. U pul keltirmaydi, lekin hamma narsa to‘g‘ri ulanganini ko‘rsatadi. Haqiqiy daromad uchun quyidagilarni bajaring.

## 1. AdMob hisobini ochish
1. <https://admob.google.com> saytiga Google hisobingiz bilan kiring va ro‘yxatdan o‘ting. 18 yoshdan katta bo‘lish kerak.
2. **To‘lovlar (Payments)** bo‘limida to‘lov manzilingizni (Uzbekiston) kiriting. Shu yerda **qaysi to‘lov usuli mavjudligini tekshiring.** Google'ning yordam sahifalariga ko‘ra usul (bank o‘tkazmasi, EFT va boshqalar) to‘lov manziliga bog‘liq. Uzbekiston bo‘yicha aniq ma'lumotni faqat hisobingizdagi shu sahifa ko‘rsatadi.

## 2. Ilovani qo‘shish
1. **Apps → Add app → Android**.
2. «Ilova Google Play'da joylanganmi?» degan savolga **Yo‘q** deb javob bering. Nomi: **Bloknot**.
3. Sizga **App ID** beriladi. U `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY` ko‘rinishida bo‘ladi, ichida `~` belgisi bor.

## 3. Banner reklama bloki
1. Ilova sahifasida **Ad units → Add ad unit → Banner**. Nomi: masalan «Pastki banner».
2. Sizga **Ad unit ID** beriladi. U `ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ` ko‘rinishida bo‘ladi, ichida `/` belgisi bor.

## 4. ID'larni yuborish
Ikkala ID'ni menga yuboring. Men ularni quyidagi fayllarga qo‘yaman va sinov rejimini o‘chiraman:
- `src/platform/adConfig.ts` (`appId`, `bannerId`, `useTestAds: false`);
- `android/app/src/main/res/values/strings.xml` (`admob_app_id`).

## Muhim ogohlantirishlar
- **O‘z reklamangizni hech qachon bosmang** va tanishlaringizdan ham bostirmang. AdMob buni firibgarlik deb hisoblaydi va hisobni butunlay yopadi. Ishlab chiqish davrida sinov reklamasi aynan shuning uchun ishlatiladi.
- Yangi hisobda haqiqiy reklamalar dastlab kam ko‘rsatilishi yoki bir necha kun cheklangan bo‘lishi mumkin. Bu odatiy hol.
- To‘liq daromad va to‘lov olish uchun odatda ilova **Google Play'da** bo‘lishi va saytingizda `app-ads.txt` fayli turishi kerak. Bu 8-bosqichda qilinadi.
- Daromad AdMob hisobidagi chegaraga (odatda 100 $) yetganda oyma-oy to‘lanadi.
