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
