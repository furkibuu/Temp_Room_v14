
# 🎧 FurkiBu Temp Room

Keyfim için yapılmış, **discord.js v14** ile geliştirilmiş modern bir **Discord Geçici Ses Odası (Temp Room) sistemi**.

Kullanıcılar bir **ses kanalına girerek kendi özel odalarını oluşturabilir** ve oluşturulan **V2 yönetim paneli** sayesinde odalarını kolayca yönetebilirler.

> GitHub: https://github.com/furkibuu

---

## ✨ Özellikler

### 🎛️ Gelişmiş Oda Yönetim Paneli (V2)
Her oluşturulan oda için otomatik bir **yönetim paneli** gönderilir (ses kanalının chat kısmına).

Panel üzerinden:

- 🔒 Odayı Kilitle / Aç  
- 👻 Odayı Gizle / Göster  
- 👥 Kullanıcı Limitini Değiştir  
- ✏️ Oda İsmini Değiştir  
- ✅ Kullanıcıya İzin Ver  
- ❌ Kullanıcının İznini Kaldır  
- 👢 Kullanıcıyı Odadan At  
- 🔁 Oda Sahipliğini Devret (Transfer)  
- 👑 Sahipsiz Odayı Sahiplen (Claim)  
- 🚫 Ban / ✅ Unban  

---

### 🧠 Akıllı Sistem
- Spam engellemek için **cooldown sistemi**
- Kullanıcı başına **tek oda limiti**
- Oda boş kalınca **otomatik silme**
- Panel **canlı güncelleme**

---

### 🛡️ Yetki Sistemi
- Oda sahibi odayı yönetebilir
- Sunucu yöneticileri (**ManageChannels**) paneli kullanabilir
- Belirli kullanıcılara özel erişim verilebilir

---

### 🗄️ Veritabanı Desteği
- **MongoDB** (önerilen)
- **Orio JSON Database** (basit kurulum)

---

## 📁 Proje Yapısı

```
.
├── Commands
│   ├── ozelodalar.js
│   └── devpanel.js
│
├── Events
│   ├── interactionCreate.js
│   ├── voiceStateUpdate.js
│   └── ready.js
│
├── Handlers
│   ├── eventLoader.js
│   └── commandLoader.js
│
├── Utils
│   ├── mongo.js
│   └── orio.js
│
├── scripts
│   └── deploy-commands.js
│
├── furki.js
├── .env
├── baslat.bat
└── package.json
```

---

## ⚙️ Kurulum

### 1️⃣ Projeyi indir
```bash
git clone https://github.com/furkibuu/FurkiBu-Temp-Room.git
cd FurkiBu-Temp-Room
```

### 2️⃣ Paketleri yükle
```bash
npm install
```

### 3️⃣ `.env` dosyasını düzenle
```env
TOKEN=BOT_TOKEN

CLIENT_ID=BOT_APPLICATION_ID
BOT_OWNER_ID=SENIN_DISCORD_ID

DB_PROVIDER=mongo
MONGO_URI=MONGO_BAGLANTI_LINKI

ORIO_FILE=furki-orio.json

TEMP_PANEL_VOICE_ID=ODA_OLUSTURMA_SES_KANALI_ID
TEMP_CATEGORY_ID=ODA_KATEGORI_ID

TEMP_NAME_TEMPLATE={user} Odası
TEMP_DEFAULT_LIMIT=2
TEMP_DELETE_DELAY_MS=8000
TEMP_COOLDOWN_MS=15000

TEMP_ALLOW_CLAIM=true
TEMP_RECOVERY=true
```

### 4️⃣ Başlat

Komutları deploy eder + botu başlatır:

```
baslat.bat
```

Alternatif:

```
node scripts/deploy-commands.js
node furki.js
```

---

## 🎮 Sistem Nasıl Çalışır

1) Kullanıcı **oda oluşturma ses kanalına** girer  
2) Bot kullanıcı için **özel bir ses kanalı** oluşturur  
3) Bot, **ses kanalının chat kısmına** V2 paneli gönderir  
4) Kullanıcı panel üzerinden odasını yönetir  

Oda **boş kaldığında otomatik silinir.**

---

## 🧩 Komutlar

### `/ozelodalar` (Admin)

- `/ozelodalar say` → Aktif oda sayısı
- `/ozelodalar liste` → Aktif odaları listeler
- `/ozelodalar temizle` → Bozuk kayıtları temizler
- `/ozelodalar bilgi oda:` → Oda bilgisi
- `/ozelodalar sil oda:` → Oda sil
- `/ozelodalar sahip oda: kisi:` → Sahip değiştir
- `/ozelodalar yenile oda:` → Paneli yeniden bas

### `/devpanel` (Sadece Bot Sahibi)

- Bot bilgileri
- Restart
- Status değiştirme

---

## 📦 Gereksinimler

- Node.js 18+
- discord.js v14
- MongoDB (opsiyonel)

---

## 📜 Lisans

MIT License

---

## ❤️ Geliştirici

**Furki**  
GitHub: https://github.com/furkibuu
