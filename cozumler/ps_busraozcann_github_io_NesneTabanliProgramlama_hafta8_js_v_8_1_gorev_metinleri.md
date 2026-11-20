# JS verisindeki görev metinleri (hafta8.js?v=8.1)

https://busraozcann.github.io/NesneTabanliProgramlama/hafta8.js?v=8.1#gorev-metinleri

Sağlanan kaynakları incelediğimde, "Kronos Ajansı" senaryosuna dayalı olarak istenen Enum tanımlamaları, soyut sınıf yapısı, kapsülleme ve sınıf hiyerarşisi için gerekli tüm teknik bilgilerin (ABC modülü kullanımı, `@abstractmethod` dekoratörü, private özellikler için çift alt çizgi kullanımı) mevcut olduğunu görüyorum.

İstenen görevlerin çözümü aşağıdadır:

### 1. Enum Tanımlamaları
Kaynaklarda belirtilen en az 6 elemanlı `Malzeme` ve en az 3'er elemanlı diğer enumlar:

```python
from enum import Enum, auto

class Malzeme(Enum):
    TAS = "#7B7B7B"
    ALTIN = "#FFD700"
    CAM = "#ADD8E6"
    AHSAP = "#8B4513"
    DEMIR = "#C0C0C0"
    MARS_TOPRAGI = "#E27B58"

class Gokyuzu(Enum):
    GUNESLI = auto()
    AURORA = auto()
    YILDIZLI = auto()

class Zemin(Enum):
    TOPRAK = auto()
    KUM = auto()
    BUZ = auto()

class Hava(Enum):
    DURGUN = auto()
    FIRTINALI = auto()
    SISLI = auto()
```

### 2. Soyut Sınıf `Cag` ve Kapsülleme
Yıla sadece `get_yil()` ile erişilmesini sağlayan soyut sınıf yapısı:

```python
from abc import ABC, abstractmethod

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

### 3. Somut Sınıf Örneği ve Kullanım
`AntikMisir` sınıfının tanımı ve nesne üretimi:

```python
class AntikMisir(Cag):
    def gok(self):
        return Gokyuzu.GUNESLI
    
    def zemin(self):
        return Zemin.KUM
    
    def hava(self):
        return Hava.DURGUN

# Nesne üretimi
misir = AntikMisir("Antik Mısır", -2560)

# Kullanım örneği
print(f"Çağ: {misir.ad}, Yıl: {misir.yil_metni()}")
```

**Soru Cevabı:**
*   **🤔 Neden yıl private?** Yılın `private` (gizli) tutulması, dışarıdan hatalı veya mantıksız değerlerin (örn: `99999`) doğrudan atanmasını engeller. Eğer doğrudan erişilebilir olsaydı, verinin bütünlüğü bozulabilirdi. `get_yil()` metodu sayesinde veriyi sadece okuyabiliriz, ancak sınıfın izni olmadan değiştiremeyiz (kapsülleme prensibi).

### 4. Arayüzler ve Canlı Yapısı (Özet)
Kaynaklardaki yönergeye göre `Hareketli` ve `Isiklandirilabilir` arayüzleri:

```python
class Hareketli(ABC):
    @abstractmethod
    def hareket_et(self):
        pass

class Isiklandirilabilir(ABC):
    @abstractmethod
    def isik(self):
        pass

class Canli(ABC):
    def __init__(self, ad, boy, malzeme):
        self.ad = ad
        self.boy = boy
        self.malzeme = malzeme
    
    @abstractmethod
    def ses(self):
        pass
```

Bu yapılar, çok biçimlilik (polymorphism) sayesinde 3D motorunun türü ne olursa olsun `hareket_et()` veya `isik()` metotlarını ortak bir sözleşme üzerinden çağırmasına olanak tanır.
