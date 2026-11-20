# JS verisindeki görev metinleri (hafta4.js)

https://busraozcann.github.io/NesneTabanliProgramlama/hafta4.js#gorev-metinleri

> Not: Kod çalıştırılmadı. Yalnızca sözdizimi denetlendi (ast.parse).

Kullanılan kaynaklar:
- https://busraozcann.github.io/NesneTabanliProgramlama/hafta4.js#kod-parcalari (seçilen haftaya ait)

4. hafta görevleri için hazırlanan çözüm aşağıdadır. Python'da `protected` yapılar için `_` (tek alt çizgi), `private` yapılar için `__` (çift alt çizgi) isimlendirme kuralı kullanılmıştır.

### 1. Sınıf Yapıları (Dinozor, Bakıcı, Yuva, Cip, Ziyaretçi)

```python
class Yuva:
    def __init__(self, yuva_id, kapasite, konum, tur, doluluk_orani):
        self.yuva_id = yuva_id
        self.kapasite = kapasite
        self.konum = konum
        self.tur = tur
        self.doluluk_orani = doluluk_orani

    def temizle(self): pass
    def guncelle(self): pass
    def kapasite_artir(self): pass
    def durum_sorgula(self): pass

class Cip:
    def __init__(self, cip_id, marka, model, yakit, hiz):
        self.cip_id = cip_id
        self.marka = marka
        self.model = model
        self.yakit = yakit
        self.hiz = hiz

    def sur(self): pass
    def dur(self): pass
    def yakit_doldur(self): pass
    def bakim_yap(self): pass

class Dinozor:
    def __init__(self, ad, tur, enerji, aclik):
        self.ad = ad
        self.tur = tur
        self._enerji = enerji  # Protected
        self._aclik = aclik    # Protected
        self.yuva = None       # Yuva ile ilişki

    def ye(self):
        self._aclik -= 10
        print(f"{self.ad} beslendi.")

class Bakıcı:
    def __init__(self, ad, yas, tecrube, departman, maas, sicil_no):
        self.ad = ad
        self.yas = yas
        self.tecrube = tecrube
        self.departman = departman
        self.__maas = maas         # Private
        self.__sicil_no = sicil_no # Private
        self.cip = None            # Cip ile ilişki
        self.yuva = None           # Yuva ile ilişki

    def yemVer(self, dinozor):
        dinozor.ye()
    
    def yuvaTemizle(self):
        if self.yuva:
            self.yuva.temizle()

    def maas_goster(self): return self.__maas
    def sicil_sorgula(self): return self.__sicil_no
    def dinlen(self): pass

class Ziyaretci:
    def __init__(self, ad, bilet_no, giris_saati, yas, tercih):
        self.ad = ad
        self.bilet_no = bilet_no
        self.giris_saati = giris_saati
        self.yas = yas
        self.tercih = tercih
        self.gozlemlenen_dinozor = None # Dinozor ile ilişki

    def bilet_kontrol(self): pass
    def dinozor_izle(self, dinozor): self.gozlemlenen_dinozor = dinozor
    def cikis_yap(self): pass
    def sikayet_et(self): pass
```

### 2. Nesne Üretimi ve Testler

```python
# 3 Dinozor Nesnesi
dino1 = Dinozor("Rex", "T-Rex", 100, 50)
dino2 = Dinozor("Spiky", "Stegosaurus", 80, 40)
dino3 = Dinozor("Longy", "Brachiosaurus", 120, 60)

# Bakıcı ve Dinozor etkileşimi
bakici = Bakıcı("Ahmet", 35, 10, "Besleme", 30000, "TC123")
bakici.yemVer(dino1)

# Private özellik denemesi
# Python'da private özelliklere dışarıdan erişim isim mangling (örn: _Bakıcı__maas) ile engellenmeye çalışılır.
try:
    print(bakici.__maas)
except AttributeError as e:
    print("Hata: Private özelliğe dışarıdan erişilemez.")
```

**Notlar ve Varsayımlar:**
*   `protected` özellikler için sınıf ve alt sınıflar tarafından erişilebilir olan `_` ön eki, `private` özellikler için doğrudan erişimi engelleyen `__` ön eki kullanılmıştır.
*   **İlişkiler:** `Dinozor -> Yuva`, `Bakıcı -> Cip`, `Ziyaretçi -> Dinozor` ve `Bakıcı -> Yuva` ilişkileri sınıf içerisinde referans değişkenleri tanımlanarak kurulmuştur.
*   **Kaynak Kullanımı:** `enerji`, `aclik` (protected) ve `maas`, `sicilNo` (private) değişkenleri belirtilen erişim belirleyicileri ile tanımlanmıştır. Sınıf metot sayıları (Bakıcı: 5, Yuva: 4, Cip: 4, Ziyaretçi: 4) ve özellik sayıları gereksinimlere uygun olarak belirlenmiştir.
