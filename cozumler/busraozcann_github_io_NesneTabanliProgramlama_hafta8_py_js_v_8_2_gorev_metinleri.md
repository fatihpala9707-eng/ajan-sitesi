# JS verisindeki görev metinleri (hafta8-py.js?v=8.2)

https://busraozcann.github.io/NesneTabanliProgramlama/hafta8-py.js?v=8.2#gorev-metinleri

Merhaba! Ben Nesne Tabanlı Programlama eğitim asistanınım. Sağladığın kaynakları inceledim. "Görev Sayfası" olarak belirttiğin metin aslında bir eğitim platformundaki hata mesajları ve ipuçlarıdır. Bu içerikten ve "Hafta 8" kaynaklarından yola çıkarak, senden istenen temel yapıyı (Enum kullanımı, Soyut sınıflar, Kapsülleme ve Arayüzler) içeren örnek bir çözüm hazırladım.

### Görev Analizi
1. **Enum Tanımları:** `Malzeme`, `Gokyuzu`, `Zemin`, `Hava`, `HareketTipi` tanımlanacak.
2. **Soyut Sınıflar:** `Cag`, `Canli` ve `Yapi` (arayüzler için temel).
3. **Kapsülleme:** `Cag` sınıfında `__yil` (private) değişkeni kullanılacak ve `get_yil()` ile erişilecek.
4. **Arayüzler:** `Hareketli` ve `Isiklandirilabilir` arayüzleri oluşturulacak.
5. **Sistem:** `ZamanAjansi` sınıfı ile çağlar yönetilecek.

### Çözüm Kodu

```python
from enum import Enum, auto
from abc import ABC, abstractmethod

# 1. Enum Tanımları
class Malzeme(Enum):
    TAS = "#808080"
    AHSAP = "#A0522D"
    ALTIN = "#FFD700"
    MERMER = "#F5F5F5"
    CAM = "#ADD8E6"
    DEMIR = "#4682B4"

class Gokyuzu(Enum):
    GUNESLI = auto()
    BULUTLU = auto()
    GECE = auto()

class Zemin(Enum):
    TOPRAK = auto()
    CIM = auto()
    KUM = auto()

class Hava(Enum):
    YAGISLI = auto()
    RUZGARLI = auto()
    DURGUN = auto()

class HareketTipi(Enum):
    YURU = auto()
    UC = auto()
    YUZ = auto()

# 2. Arayüzler ve Soyut Sınıflar
class Hareketli(ABC):
    @abstractmethod
    def hareket_et(self):
        pass

class Isiklandirilabilir(ABC):
    @abstractmethod
    def isik(self) -> Malzeme:
        pass

class Cag(ABC):
    def __init__(self, ad, yil):
        self.ad = ad
        self.__yil = yil # Private (Kapsülleme)

    def get_yil(self):
        return self.__yil

    def yil_metni(self):
        y = self.get_yil()
        return f"MÖ {abs(y)}" if y < 0 else f"MS {y}"

    @abstractmethod
    def gok(self): pass
    @abstractmethod
    def zemin(self): pass
    @abstractmethod
    def hava(self): pass

# 3. Örnek Sınıf ve Uygulama
class AntikMisir(Cag):
    def gok(self): return Gokyuzu.GUNESLI
    def zemin(self): return Zemin.KUM
    def hava(self): return Hava.DURGUN

class ZamanAjansi:
    def __init__(self, ad):
        self.ad = ad
        self.caglar = []

    def cag_ekle(self, cag):
        self.caglar.append(cag)

    def zaman_cizelgesi(self):
        return sorted(self.caglar, key=lambda c: c.get_yil())

# Kullanım Örneği
misir = AntikMisir("Antik Mısır", -2560)
ajans = ZamanAjansi("Kronos")
ajans.cag_ekle(misir)

print(f"{misir.ad} Çağı: {misir.yil_metni()}")
```

### Önemli Notlar ve İpuçları
*   **Enum Kullanımı:** Kodda gördüğünüz gibi `Renk.MAVI` şeklinde bir kullanım yapıyoruz. Eğer `Renk.MAVI` yerine sadece `"mavi"` yazarsanız, sistem bunu bir metin olarak algılar ve `Enum`'ın sağladığı tip güvenliğini (yazım hatası durumunda hata verme özelliği) kaybedersiniz.
*   **Kapsülleme:** `self.__yil` kullanımı, dışarıdan doğrudan `nesne.yil = 999` atamasını engeller. Bu, verinin bütünlüğünü korumak için kritik bir OOP kuralıdır.
*   **Soyut Sınıflar:** `ABC` (Abstract Base Class) ve `@abstractmethod` kullanımı, alt sınıfların zorunlu olarak belirli metotları (gok, zemin gibi) içermesini garanti eder. Bu da mimari tasarımın tutarlı olmasını sağlar.
