# 8. Hafta Ödevi ▶ | NYP Atölyesi

https://busraozcann.github.io/NesneTabanliProgramlama#etkilesim-1-8_Hafta_devi

Merhaba! Kronos Ajansı'nın baş mimarı olarak 8. Hafta ödevindeki görevlerini adım adım yerine getirelim.

### Kaynaklara İlişkin Not
İstediğin görevler, paylaştığın `gorev_icerigi` ve `kaynaklar` içindeki yönergelerle doğrudan eşleşmektedir. Kod yapısı için `abc` (Abstract Base Class) modülünden `ABC` ve `abstractmethod`, ayrıca `enum` modülünden `Enum` ve `auto` yapıları kullanılmıştır.

---

### 1. Görev: Enum ve Soyut Sınıf Tanımlamaları

Bu kısımda gerekli 4 enum'u ve `Cag` soyut sınıfını kodluyoruz. 

*   **Malzeme:** 6 renk kodu (HEX).
*   **Gokyuzu, Zemin, Hava:** En az 3'er sabit.
*   **Cag:** Soyut sınıf; `ad` (str) ve gizli `__yil` (int) özelliklerine sahip. `yil_metni()` metodu belirtilen mantıkta çalışır.

```python
from abc import ABC, abstractmethod
from enum import Enum, auto

# ---- Enum'lar ----
class Malzeme(Enum):
    TAS = "#808080"
    KUM = "#E1C699"
    ALTIN = "#FFD700"
    MERMER = "#F0F8FF"
    AHSAP = "#8B4513"
    SU = "#0000FF"

class Gokyuzu(Enum):
    GUNDUZ = auto()
    GECE = auto()
    AURORA = auto()

class Zemin(Enum):
    DUZ = auto()
    DAGLIK = auto()
    SU_ALTI = auto()

class Hava(Enum):
    GUNESLI = auto()
    YAGMURLU = auto()
    KARLI = auto()

# ---- Soyut Sınıf ----
class Cag(ABC):
    def __init__(self, ad, yil):
        self.ad = ad
        self.__yil = yil  # Private özellik

    def get_yil(self):
        return self.__yil

    def yil_metni(self):
        y = self.get_yil()
        if y < 0:
            return f"MÖ {abs(y)}"
        else:
            return f"MS {y}"

    @abstractmethod
    def gok(self):
        pass

    @abstractmethod
    def zemin(self):
        pass

    @abstractmethod
    def hava(self):
        pass
```

---

### 2. Görev: Antik Mısır Sınıfı ve Nesne Üretimi

`Cag` soyut sınıfından türeyen `AntikMisir` sınıfı ve istenen nesne örneği aşağıdadır:

```python
# ---- Sınıflar ----
class AntikMisir(Cag):
    def gok(self):
        return Gokyuzu.GUNDUZ
    
    def zemin(self):
        return Zemin.DUZ
    
    def hava(self):
        return Hava.GUNESLI

# ---- Nesneler: çağlarını kur ----
misir = AntikMisir("Antik Mısır", -2560)

# Kontrol
print(f"Çağ: {misir.ad}, Yıl: {misir.yil_metni()}")
```

---

### 🤔 Sorunun Yanıtı
**Neden yıl private? Biri `misir.yil = 99999` yazarsa ne olurdu?**

Yılın `private` (`__yil`) tutulmasının sebebi, verinin bütünlüğünü korumaktır. Eğer yıl `public` olsaydı, herhangi bir kullanıcı veya hatalı bir kod, tarihi mantıksız bir değere (örneğin 99999 veya gelecekteki bir tarihe) değiştirebilirdi. Bu durum, zaman çizelgesinin bozulmasına ve uygulamanın tutarsız çalışmasına neden olurdu. Private kullanarak, veriye sadece sınıfın kendi metotları (`get_yil` gibi) üzerinden kontrollü erişim sağlarız.

---

### 📐 UML Planı İçin İpuçları
*   **Enum Kutuları:** Plan (UML) aracında her bir enum için «enumeration» başlığını seç ve içerisine sabitleri (KIRMIZI, MAVI vb.) alt alta yaz.
*   **Cag Kutusu:** `Cag` sınıfını "Soyut" olarak işaretle. Özellik olarak `- yil: int` ve `+ get_yil(): int` ekle. Metot olarak `+ gok(): Gokyuzu {abstract}` şeklinde soyut olduğunu belirt.
*   **İlişki:** `AntikMisir` kutusundan `Cag` kutusuna bir "Kalıtım" (boş üçgen uçlu ok) çizgisi çek.
