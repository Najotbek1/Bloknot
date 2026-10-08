# Play Console → «Data safety» anketasi uchun javoblar

Ilovaning o'zi hech qanday ma'lumot yig'maydi va yubormaydi: hamma narsa telefonda qoladi. Lekin ilovada **Google AdMob** reklamasi bor va Google Mobile Ads SDK ba'zi ma'lumotlarni yig'adi. Play qoidalariga ko'ra, SDK yig'adigan ma'lumot ham anketada ko'rsatilishi **shart**.

> Javob berishdan oldin Google'ning rasmiy sahifasini tekshiring: **«Google Mobile Ads SDK — Play data disclosure»**, ya'ni developers.google.com/admob/android/privacy/play-data-disclosure. SDK versiyasi o'zgarganda u yerdagi ro'yxat yangilanishi mumkin. Pastdagi javoblar shu sahifaga asoslangan.

## Umumiy savollar
| Savol | Javob |
|---|---|
| Ilova foydalanuvchi ma'lumotlarini yig'adimi yoki ulashadimi? | **Ha**, AdMob SDK sababli |
| Barcha ma'lumotlar uzatishda shifrlanganmi? | **Ha** |
| Foydalanuvchi ma'lumotlarini o'chirishni so'ray oladimi? | Ilovaning o'zida hisob yo'q, barcha ma'lumot qurilmada. Ilovani o'chirish hammasini o'chiradi. Anketada **«Ha»** deb, izohda shu tushuntirishni yozing |

## Ma'lumot turlari (faqat AdMob uchun)
| Tur | Yig'iladi | Ulashiladi | Maqsad |
|---|---|---|---|
| **Location → Approximate location** (IP asosida) | Ha | Ha | Advertising or marketing, Fraud prevention |
| **App activity → App interactions** | Ha | Ha | Advertising or marketing, Analytics, Fraud prevention |
| **App info and performance → Diagnostics** | Ha | Ha | Analytics, Fraud prevention |
| **Device or other IDs** (Advertising ID, App set ID) | Ha | Ha | Advertising or marketing, Analytics, Fraud prevention |

Har biri uchun: **Ephemeral emas**, **majburiy** (reklama SDK'si ishlashi uchun).

Rejalar, yozuvlar, ism, email, kontaktlar, rasmlar va boshqa shaxsiy ma'lumotlar **yig'ilmaydi**.

## Boshqa deklaratsiyalar
- **Advertising ID:** ilova reklama ID'sini ishlatadi (AdMob). `com.google.android.gms.permission.AD_ID` ruxsati SDK orqali avtomatik qo'shiladi. «Advertising ID» deklaratsiyasida **«Ha, reklama uchun»** deb belgilang.
- **Ads:** «Ilovada reklama bormi?» → **Ha**.
- **Target audience:** 13+ yoki 18+ tanlang. Bolalar uchun (Families) dastur emas, aks holda AdMob sozlamalarini o'zgartirish kerak bo'ladi.
- **Privacy policy URL:** `https://najotbek1.github.io/Bloknot/privacy.html`. Kod `main`ga qo'shilib, GitHub Pages yoqilgandan keyin ishlaydi.
