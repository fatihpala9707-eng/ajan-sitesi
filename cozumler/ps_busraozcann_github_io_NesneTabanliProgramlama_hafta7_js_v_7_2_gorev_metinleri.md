# JS verisindeki görev metinleri (hafta7.js?v=7.2)

https://busraozcann.github.io/NesneTabanliProgramlama/hafta7.js?v=7.2#gorev-metinleri

Görev metinlerinde belirtilen **Siparis** sınıfı ve ilgili metotların gereksinimleri, sağlanan kaynaklardaki `Siparis` ve `Urun` yapıları temel alınarak aşağıda çözümlenmiştir.

### Görev 1: Sipariş Sınıfının Oluşturulması

`Siparis` sınıfı; `musteri`, `odeme`, `kurye` ve `mesafe` bilgilerini saklayacak ve ürünleri yönetecektir.

```python
class Siparis:
    def __init__(self, musteri, odeme, kurye, mesafe):
        self.musteri = musteri
        self.odeme = odeme
        self.kurye = kurye
        self.mesafe = mesafe
        self.urunler = []

    def ekle(self, urun):
        self.urunler.append(urun)

    def toplam(self):
        # Kaynaklardaki KE-06 döngü mantığına göre toplam hesaplama
        toplam_fiyat = 0
        for urun in self.urunler:
            toplam_fiyat += urun.fiyat()
        return toplam_fiyat
```

### Görev 2: Menü ve Fiyat Hesaplama Mantığı

`Menu` sınıfı, `Urun` sınıfından miras aldığı için kendisi de bir `Urun` gibi davranır. `Menu` nesnesi, içine aldığı ürünlerin fiyatlarını `toplam()` metodu ile hesaplar.

```python
class Menu(Urun):
    def __init__(self, ad, urunler):
        super().__init__(ad, 0)
        self.urunler = urunler

    def fiyat(self):
        # Menünün fiyatı, içindeki ürünlerin fiyatlarının toplamıdır
        toplam_fiyat = 0
        for urun in self.urunler:
            toplam_fiyat += urun.fiyat()
        return toplam_fiyat
```

### Görev 3: Ödeme İşlemleri (Sipariş Mantığı)

Kaynaklarda verilen `odemeyi_al` metodu, siparişin ödeme nesnesi üzerinden polimorfik (çok biçimli) olarak çalışır:

```python
    def odemeyi_al(self):
        tutar = self.toplam()
        # Kaynaklardaki isinstance ve tur() kontrolleri
        if isinstance(self.odeme, Nakit):
            return True
        elif isinstance(self.odeme, Kart):
            return self.odeme.ode(tutar)
        elif self.odeme.tur() == "Yemek Kartı":
            return self.odeme.ode(tutar)
        return False
```

### Önemli Notlar ve Varsayımlar:
1.  **Miras ve Override:** `Tost` ve `KampanyaTost` sınıfları `Urun` sınıfından miras almıştır. `KampanyaTost` sınıfı kendi `__init__` metodunu yazarken `super().__init__(ad, taban_fiyat)` çağrısı yaparak üst sınıfın özelliklerini (ad ve fiyat) doğru bir şekilde başlatmalıdır.
2.  **Sessiz Hatalar:** Metot adlarında (`fiyat` vs `fiyatt`) yapılan küçük yazım yanlışlarının override işlemini bozacağı, `self.fiyat()` çağrısının nesnenin kendi sınıfındaki `fiyat()` metodunu dinamik olarak bulacağı (polimorfizm) unutulmamalıdır.
3.  **Soyut Sınıflar:** `Bildirim` veya `Cag` gibi sınıflar `ABC` (Abstract Base Class) kullanılarak tanımlanmıştır; bu sınıflardan doğrudan nesne türetilemez, sadece alt sınıflar üzerinden kullanılabilirler.
