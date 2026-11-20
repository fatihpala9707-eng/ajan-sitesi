# JS verisindeki görev metinleri (hafta4.js)

https://busraozcann.github.io/NesneTabanliProgramlama/hafta4.js#gorev-metinleri

Merhaba! Ben Nesne Tabanlı Programlama eğitim asistanınım. Paylaştığın görev sayfasını ve kaynak dokümanları inceledim.

**Not:** Kaynaklarda 4. haftaya dair doğrudan bir "çözüm kodu" yoktur; ancak erişim belirleyiciler, sınıf ilişkileri ve Python/C# sözdizimi kuralları tanımlanmıştır. İstediğin görevleri, nesne tabanlı programlama prensiplerine (kapsülleme, kalıtım, ilişkilendirme) uygun olarak C# dilinde aşağıda çözdüm.

### 1. Sınıf Yapılandırmaları ve İlişkiler

Görevdeki tüm sınıfları, istenen erişim belirleyicileri (private `-`, protected `#`, public `+`) ve ilişkileri içerecek şekilde hazırladım.

```csharp
using System;
using System.Collections.Generic;

// 1. Dinozor Sınıfı
public class Dinozor {
    public string Ad;
    protected int Enerji; // protected #
    protected int Aclik;  // protected #

    public Dinozor(string ad, int enerji, int aclik) {
        Ad = ad; Enerji = enerji; Aclik = aclik;
    }

    public virtual void Ye() {
        Aclik += 10;
        Console.WriteLine($"{Ad} yemek yedi.");
    }
}

// 2. Bakıcı Sınıfı
public class Bakici {
    private double maas;      // private -
    private string sicilNo;   // private -
    public string Ad;
    public int Yas;
    public string Uzmanlik;
    public List<Cip> Cipler = new List<Cip>();

    public Bakici(string ad, double m, string no) { Ad = ad; maas = m; sicilNo = no; }

    public void YemVer(Dinozor d) { d.Ye(); } // Bakıcı, dinozorun ye() metodunu çağırır
    public void YuvaTemizle(Yuva y) { Console.WriteLine("Yuva temizlendi."); }
    public void CipTak(Cip c) { Cipler.Add(c); }
    public void MaasAl() { Console.WriteLine("Maaş alındı."); }
    public void MesaiBaslat() { Console.WriteLine("Mesai başladı."); }
}

// 3. Yuva Sınıfı
public class Yuva {
    public int Kapasite;
    public string Konum;
    public bool TemizMi;
    public List<Dinozor> Dinozorlar = new List<Dinozor>(); // İlişki: Dinozor -> Yuva
    public string Malzeme;

    public void DinozorEkle(Dinozor d) { Dinozorlar.Add(d); }
    public void Temizle() { TemizMi = true; }
    public void KapiKilitle() { }
    public void IsikAc() { }
}

// 4. Cip Sınıfı
public class Cip {
    private string cipNo; // private -
    public string Model;
    public string Uretici;
    public DateTime UretimTarihi;
    public bool AktifMi;

    public void Calistir() { }
    public void Durdur() { }
    public void Guncelle() { }
    public void Sifirla() { }
}

// 5. Ziyaretçi Sınıfı
public class Ziyaretci {
    public string Ad;
    public int BiletNo;
    public string TurTarihi;
    public double OdenenUcret;
    public List<Dinozor> GorulenDinozorlar = new List<Dinozor>(); // İlişki: Ziyaretçi -> Dinozor

    public void BiletAl() { }
    public void DinozorIzle(Dinozor d) { }
    public void HediyeAl() { }
    public void CikisYap() { }
}
```

### 2. Görev Çözümleri ve Uygulamalar

**Görev: 3 Dinozor Nesnesi Üretme**
Aşağıdaki kod, `Nesneler` sekmesindeki mantığı temsil eder:
```csharp
Dinozor d1 = new Dinozor("Rex", 100, 50); // Renk bilgisi eklenerek genişletilebilir
Dinozor d2 = new Dinozor("Tric", 80, 40);
Dinozor d3 = new Dinozor("Ptera", 90, 60);
```

**Görev: Private Özelliği Değiştirmeyi Deneme (Hata Senaryosu)**
`Bakici` sınıfındaki `maas` özelliği `private` olduğu için, sınıf dışından erişilmeye çalışıldığında derleme hatası alınır:
```csharp
Bakici b = new Bakici("Ahmet", 5000, "123");
// b.maas = 10000; // HATA: 'Bakici.maas' is inaccessible due to its protection level.
```
*Açıklama: Private (özel) üyeler, sadece tanımlandıkları sınıfın kendi metotları içerisinden değiştirilebilir. Dışarıdan doğrudan erişim kısıtlanmıştır.*

### Varsayımlarım:
*   **İlişkiler:** Dinozorlar ile Yuva arasında "içerme" (composition/aggregation) ilişkisi olduğu varsayılarak `List<Dinozor>` kullanılmıştır.
*   **Erişim Belirleyiciler:** C#'taki `private` ve `protected` anahtar kelimeleri, UML diyagramındaki `-` ve `#` sembollerini tam olarak karşıladığı için bu şekilde kullanılmıştır.
*   **Bakıcı-Cip İlişkisi:** Bir bakıcının birden fazla çip (takip cihazı vb.) yönetebileceği varsayımıyla `List<Cip>` eklenmiştir.
