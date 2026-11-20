# JS verisindeki görev metinleri (hafta5-py.js)

https://busraozcann.github.io/NesneTabanliProgramlama/hafta5-py.js#gorev-metinleri

Belirttiğiniz kaynakları inceledim. Paylaştığınız içerik, Nesne Tabanlı Programlama (OOP) dersinin hata mesajlarını ve çeşitli konu başlıklarını (sınıflar, miras, soyut sınıflar, enumlar) içeren bir eğitim materyalidir.

Bu sayfadaki yönergelere dayanarak, özellikle üzerinde durulan **"Karakter"** yapısı ile ilgili görevlerin çözümü aşağıdadır:

### Görev: Karakter Sınıfını Python'a Uyarlama
Karakter sınıfı için; soyut bir yapı, private (`__can`) ve protected (`#guc`) özellikler ile istenen metodolojiyi aşağıda bulabilirsiniz.

```python
from abc import ABC, abstractmethod

class Karakter(ABC):
    def __init__(self, ad, can, guc):
        self.ad = ad              # Public
        self.__can = can          # Private
        self._guc = guc           # Protected

    # Private 'can' özelliğine açılan kapı (erişim metodu)
    def can_kazan(self, miktar: int):
        if miktar > 0:
            self.__can += miktar
    
    def get_can(self):
        return self.__can

    # Soyut metot örneği
    @abstractmethod
    def saldir(self, hedef):
        pass

    # Diğer metotlar
    def guc_artir(self):
        self._guc += 10
        
    def durum(self):
        print(f"{self.ad}: Can={self.__can}, Güç={self._guc}")

# Kullanım örneği:
class Savasci(Karakter):
    def saldir(self, hedef):
        print(f"{self.ad}, {hedef} üzerine saldırıyor!")

# Test
s = Savasci("Aragorn", 100, 50)
s.can_kazan(20)
s.durum()
```

---

### Görev Yönergesi Analizi ve Çözümler

**1. Hata Mesajlarının Anlamı ve Çözümü:**
*   **`self.__${x[3]} hiç oluşturulmamış`**: Sınıf içinde `__init__` metodunda `self.__degisken = değer` şeklinde bir tanımlama yapmadığınız anlamına gelir. Private değişkenleri mutlaka `__init__` içerisinde tanımlamalısınız.
*   **`🔒 __${x[3]} private!`**: Private değişkenlere dışarıdan erişilemez. Çözüm olarak sınıf içine bir "getter" metodu (örneğin `get_bakiye()`) ekleyerek değeri dışarıya döndürmelisiniz.
*   **`None üzerinde .${x[1]} kullanıldı`**: Bir değişkeni (`self.danisman = None`) olarak başlattıktan sonra, kontrol etmeden doğrudan üzerinde bir işlem yapmaya çalışıyorsunuz demektir. Önce `if self.danisman is not None:` kontrolü yapmalısınız.

**2. Enum Kullanımı (Hafta 6 ve 8):**
Enum kullanımı, hatalı veri girişini (örneğin "mavi" yerine "mavı" yazılması) engellemek içindir.
*   **Örnek:**
    ```python
    from enum import Enum

    class Renk(Enum):
        KIRMIZI = "#E5484D"
        MAVI = "#3D8BFF"

    # Kullanımı: 
    araba_rengi = Renk.MAVI
    ```
    Bu yöntemle, geçersiz bir renk girildiğinde Python çalışma zamanında hata vererek sistemin bozulmasını engeller.

**3. Override (Geçersiz Kılma) Uyarısı:**
*   Ebeveyn sınıftaki bir metodu alt sınıfta yeniden tanımlarken isim hatası yapmamaya dikkat edin (Örn: `ses()` vs `seS()`). Eğer isimler tam olarak uyuşmazsa, override gerçekleşmez ve ebeveynin metodu çalışmaya devam eder; bu "sessiz hata" olarak adlandırılır.
