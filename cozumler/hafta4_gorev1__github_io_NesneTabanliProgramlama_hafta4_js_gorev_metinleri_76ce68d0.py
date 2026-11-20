class Yuva:
    def __init__(self, id, konum, kapasite, temizlik_durumu, tür):
        self.id = id
        self.konum = konum
        self.kapasite = kapasite
        self.temizlik_durumu = temizlik_durumu # % değeri
        self.tür = tür

    def temizle(self):
        self.temizlik_durumu = 100
        print(f"Yuva {self.id} temizlendi.")

    def bilgi_ver(self):
        return f"Yuva {self.id} durumu: %{self.temizlik_durumu}"

    def kapasite_guncelle(self, yeni_kapasite):
        self.kapasite = yeni_kapasite

    def isinma_ac(self):
        print(f"Yuva {self.id} ısıtıcı açıldı.")

class Dinozor:
    def __init__(self, isim, renk, enerji, aclik):
        self.isim = isim
        self.renk = renk
        self._enerji = enerji  # Protected
        self._aclik = aclik    # Protected
        self.yuva = None

    def ye(self):
        self._aclik -= 20
        self._enerji += 10
        print(f"{self.isim} beslendi. Yeni açlık seviyesi: {self._aclik}")

    def yuva_ata(self, yuva):
        self.yuva = yuva

class Cip:
    def __init__(self, plaka, marka, model, yil, __cipNo):
        self.plaka = plaka
        self.marka = marka
        self.model = model
        self.yil = yil
        self.__cipNo = __cipNo # Private

    def sur(self):
        print("Cip hareket ediyor.")

    def yakit_al(self):
        print("Yakıt alınıyor.")

    def konum_bildir(self):
        return "Konum: Dino Vadisi"

    def __tamir_et(self): # Private metot
        print("Cip tamir edildi.")

class Bakıcı:
    def __init__(self, isim, yas, deneyim, departman, __maas, __sicilNo):
        self.isim = isim
        self.yas = yas
        self.deneyim = deneyim
        self.departman = departman
        self.__maas = __maas      # Private
        self.__sicilNo = __sicilNo # Private
        self.cip = None

    def yemVer(self, dinozor):
        print(f"Bakıcı {self.isim}, {dinozor.isim}'e yem veriyor.")
        dinozor.ye()

    def yuvaTemizle(self, yuva):
        print(f"Bakıcı {self.isim} temizliğe başlıyor.")
        yuva.temizle()

    def cip_ata(self, cip):
        self.cip = cip

    def maas_goster(self):
        return f"Maaş: {self.__maas}"

    def calis(self):
        print("Bakıcı çalışıyor.")

class Ziyaretçi:
    def __init__(self, bilet_no, isim, grup, ziyaret_saati, notlar):
        self.bilet_no = bilet_no
        self.isim = isim
        self.grup = grup
        self.ziyaret_saati = ziyaret_saati
        self.notlar = notlar

    def dinozor_izle(self, dinozor):
        print(f"Ziyaretçi {self.isim}, {dinozor.isim} adlı dinozoru izliyor.")

    def bilet_iptal(self):
        print("Bilet iptal edildi.")

    def yorum_yap(self, yorum):
        print(f"Ziyaretçi dedi ki: {yorum}")

    def guvenlik_uyarisi(self):
        print("Lütfen bariyerlere yaklaşmayın!")

# Nesneler
d1 = Dinozor("Rex", "Yeşil", 100, 50)
d2 = Dinozor("Tri", "Mavi", 80, 60)
d3 = Dinozor("Long", "Kırmızı", 90, 40)

# Private özellik denemesi:
# Python'da tam anlamıyla private yoktur ancak __ ön eki ile isim mangling yapılır.
# Dışarıdan doğrudan erişim hata verecektir.
try:
    bakici = Bakıcı("Ahmet", 30, 5, "Etçil", 15000, 101)
    print(bakici.__maas)
except AttributeError as e:
    print(f"\nBaşarılı! Private özelliğe dışarıdan erişilemedi: {e}")
