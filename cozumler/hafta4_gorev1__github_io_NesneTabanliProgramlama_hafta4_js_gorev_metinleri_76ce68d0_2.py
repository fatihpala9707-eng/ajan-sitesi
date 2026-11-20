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
