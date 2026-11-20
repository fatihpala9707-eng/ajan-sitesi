# JS verisindeki görev metinleri (hafta5.js)

https://busraozcann.github.io/NesneTabanliProgramlama/hafta5.js#gorev-metinleri

Verdiğiniz kaynak içeriklerini inceledim. Paylaştığınız metinler; bir oyun veya eğitim simülasyonu uygulamasının ("Vize Zindanı") arayüz yönlendirmelerini, UML tasarım kurallarını ve Nesne Tabanlı Programlama (OOP) kavramlarını içeren bir dokümantasyondur.

Bu sayfadaki temel görev, belirtilen kurallara uygun şekilde **Nesne Tabanlı Programlama** prensipleriyle (Soyut Sınıflar, Kalıtım, Arayüzler ve Enumlar) bir kod yapısı oluşturmaktır.

Aşağıda, kaynaklardaki yönergeler doğrultusunda hazırlanmış örnek bir yapı bulunmaktadır:

### 1. Enum Tanımlamaları
`Renk`, `HareketTipi` gibi sabitleri içeren yapılar için:
```python
from enum import Enum, auto

class Malzeme(Enum):
    TAS = "#7B7B7B"
    TOPRAK = "#A0522D"
    BUZ = "#E0FFFF"
    ALTIN = "#FFD700"
    CAM = "#ADD8E6"
    METAL = "#C0C0C0"

class HareketTipi(Enum):
    YURU = auto()
    UC = auto()
    YUZ = auto()
```

### 2. Soyut Sınıflar ve Arayüzler
Kalıtım ve sözleşme (arayüz) yapısı için:
```python
from abc import ABC, abstractmethod

class Cag(ABC):
    def __init__(self, ad, yil):
        self.ad = ad
        self.__yil = yil  # Private değişken

    def get_yil(self):
        return self.__yil

    @abstractmethod
    def gok(self): pass

    @abstractmethod
    def zemin(self): pass

class Hareketli(ABC):
    @abstractmethod
    def hareket_et(self): pass
```

### 3. Uygulama Örneği (Kalıtım ve Arayüz)
`Dinozor` sınıfı `Canli` soyut sınıfından türetilir ve `Hareketli` arayüzünü gerçekleştirir:
```python
class Canli(ABC):
    def __init__(self, ad, boy, malzeme):
        self.ad = ad
        self.boy = boy
        self.malzeme = malzeme

    @abstractmethod
    def ses(self): pass

class Dinozor(Canli, Hareketli):
    def ses(self):
        return "ROAARR!"
    
    def hareket_et(self):
        return HareketTipi.YURU
```

### 4. Zaman Ajansı (Bileşim - Composition)
Ajansın çağları yönettiği yapı:
```python
class ZamanAjansi:
    def __init__(self, ad):
        self.ad = ad
        self.caglar = [] # Toplama (Aggregation)

    def cag_ekle(self, cag):
        self.caglar.append(cag)

    def zaman_cizelgesi(self):
        # Yıla göre sıralama (get_yil metodu ile)
        return sorted(self.caglar, key=lambda c: c.get_yil())
```

### Görev Notları:
1.  **PDF Alınması:** Kaynakta belirtildiği üzere `📄 PDF` düğmesi, "görev defterindeki" tüm görevler (UML diyagramı ve kodlama adımları) tamamlandığında aktif olacaktır. Bu düğmeyi kullanmak için önce belirtilen tüm sınıfları ve arayüzleri uygulama içindeki editöre yazıp çalıştırdığınızdan emin olun.
2.  **Güvenlik ve Kapsülleme:** Kaynaklarda vurgulanan `__yil` (private) kullanımı, verinin dışarıdan doğrudan değiştirilmesini engeller. `misir.yil = 99999` gibi bir atama, `__` öneki sayesinde hata verecek veya engellenecektir.
3.  **Hata Giderme:** Eğer UML diyagramınızda `class` parantezinde hata alıyorsanız, kod tarafında `class Dinozor(Canli, Hareketli):` gibi doğru üst sınıf ve arayüz sıralamasını yaptığınızdan emin olun.

**İpucu:** Görevleri tamamladıkça sol taraftaki "Görev Defteri" üzerinden ilerlemenizi takip edebilir, tüm görevler bittiğinde üst menüden PDF çıktınızı alabilirsiniz.
