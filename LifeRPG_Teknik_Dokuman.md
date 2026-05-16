
# LifeRPG - Teknik Şartname ve Proje Planı

Bu döküman, "LifeRPG" adlı gerçek dünya tabanlı RPG (Life Gamification) uygulamasının teknik detaylarını, algoritmalarını ve kullanıcı arayüzü yapısını içermektedir.

## 1. Uygulama Vizyonu ve Ana Motto
**Motto:** "Kendini kandırma, doğal bir şekilde istediğin gibi alışkanlıklarını düzenle."
**Amacı:** Kullanıcının uzmanlık alanına göre görevler tanımlaması, bu görevlerle seviye atlaması ve disiplin mekanizmasıyla gerçek hayatta gelişim sağlaması.

## 2. Teknik Mimari (Tech Stack)
* **Platform:** Android ve iOS (React Native veya Flutter).
* **Veritabanı:** Yerel Depolama (SQLite veya Realm). Tüm veriler kullanıcının cihazında saklanır.
* **Tema:** Dinamik Karanlık/Aydınlık mod.
* **Dil:** Çoklu dil desteği (Türkçe ve İngilizce).

## 3. Veri Modelleri

### Görev (Task) Modeli
| Alan | Tip | Açıklama |
| :--- | :--- | :--- |
| `id` | UUID | Benzersiz kimlik. |
| `name` | String | Görev adı (Örn: "STM32 Çalış"). |
| `baseXP` | Integer | 0-100 arası temel tecrübe puanı. |
| `skills` | Map | Geliştirilen yetenekler ve puanları. |
| `isProject` | Boolean | Eğer true ise XP düşüşü uygulanmaz. |
| `count` | Integer | Görevin toplam kaç kez tamamlandığı. |

### Kullanıcı (User) Modeli
| Alan | Tip | Açıklama |
| :--- | :--- | :--- |
| `level` | Integer | Mevcut seviye. |
| `currentXP` | Integer | Mevcut XP. |
| `skills` | Object | Sosyal, Odak, Zeka, Dayanıklılık, Disiplin puanları. |
| `titles` | Array | Kazanılan lakaplar ve bonusları. |
| `lastLogin` | Date | Son giriş tarihi (Disiplin kontrolü için). |

## 4. Temel Algoritmalar

### A. Azalan Verim (Diminishing Returns) XP Algoritması
Proje olmayan görevlerde, tekrar sayısı arttıkça kazanılan XP ve yetenek puanı azalır.
* **1. Tamamlama:** %100 XP.
* **10. Tamamlama:** %50 XP.
* **20. Tamamlama:** %20 XP.
* **Formül:** `Kazanılan XP = BaseXP * (1 / (1 + (Tekrar_Sayısı * 0.1)))`

### B. Disiplin ve Ceza Sistemi
* **Günlük Giriş:** +1 Disiplin Puanı.
* **Girilmeyen Gün:** -1 Disiplin Puanı.
* **Ağır Ceza:**
    * 5 gün üst üste girilmezse: Tüm yetenek puanlarında %10 kayıp.
    * 10 gün üst üste girilmezse: Tüm yetenek puanlarında %20 kayıp.
    * Sistem %10'ar artışla doğrusal (linear) devam eder.

## 5. Kullanıcı Arayüzü (Sekmeler)

### Sekme 1: Görevler
* Görev ekleme, düzenleme ve silme.
* Yeteneklerin (Sosyal, Odak, Zeka, vb.) manuel atanması.
* Görev tamamlama butonu.

### Sekme 2: Profil
* Seviye barı ve seviye göstergesi.
* Yeteneklerin puan listesi.
* Günün mottosunun gösterimi.

### Sekme 3: Lakaplar (Titles)
* Yetenek puanlarına göre (50, 100, 150...) açılan özel ünvanlar.
* **Pasif Bonuslar:** Lakaplar, görev sonunda kazanılan puanları (Örn: x2 çarpan) artırabilir.

### Sekme 4: Ayarlar
* Tema seçimi (Karanlık/Aydınlık).
* Dil seçimi (TR/EN).
* Veri paylaşım izni (Geliştiriciye anonim veri gönderimi).

## 6. Güvenlik ve Gizlilik
Şuanda açık bir özellik değil. Kullanıcı verileri varsayılan olarak cihazda tutulur. Ayarlar kısmından "Veri Paylaşımı" aktif edilirse geliştiriciye sistem iyileştirme amaçlı veri gönderilir.
