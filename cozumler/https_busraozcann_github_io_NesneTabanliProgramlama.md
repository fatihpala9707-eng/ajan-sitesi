# NYP Atölyesi

https://busraozcann.github.io/NesneTabanliProgramlama

Merhaba! Ben nesne tabanlı programlama (OOP) eğitim asistanınım. 8. hafta ödevi olan **"Kronos Ajansı"** görevlerini, verdiğin kaynak kodlarını ve OOP prensiplerini baz alarak senin için çözdüm.

### 1. Enum Yapıları
Kaynaklarda belirtildiği üzere; `Malzeme`, `Gokyuzu`, `Zemin` ve `Hava` enumlarını oluşturuyoruz.

```csharp
using System;

public enum Malzeme { 
    TAS = "#7B7B7B", TOPRAK = "#8B4513", BUZ = "#A0F0FF", 
    METAL = "#C0C0C0", CAM = "#E0FFFF", CICEK = "#FF69B4" 
}
public enum Gokyuzu { GUNESLI, YILDIZLI, BULUTLU }
public enum Zemin { TOPRAK, BETON, KUM }
public enum Hava { SAKIN, FIRTINALI, SISLI }
public enum HareketTipi { YURU, UC, YUZ }
```

### 2. Soyut Sınıflar ve Arayüzler
`Cag` soyut sınıfı ve `Hareketli`, `Isiklandirilabilir` arayüzlerini tanımlıyoruz.

```csharp
public abstract class Cag {
    public string Ad { get; set; }
    private int _yil;

    protected Cag(string ad, int yil) { Ad = ad; _yil = yil; }
    public int GetYil() => _yil;
    
    public string YilMetni() => _yil < 0 ? $"MÖ {Math.Abs(_yil)}" : $"MS {_yil}";

    public abstract Gokyuzu Gok();
    public abstract Zemin Zemin();
    public abstract Hava Hava();
}

public interface IHareketli { HareketTipi HareketEt(); }
public interface IIsiklandirilabilir { Malzeme Isik(); }
```

### 3. Canlı ve Yapı Sınıfları
`Canli` soyut sınıfı ve türeyen `Dinozor` sınıfı:

```csharp
public abstract class Canli {
    public string Ad { get; set; }
    public int Boy { get; set; }
    public Malzeme Renk { get; set; }
    public abstract string Ses();
}

public class Dinozor : Canli, IHareketli {
    public override string Ses() => "ROARR!";
    public HareketTipi HareketEt() => HareketTipi.YURU;
}
```

### 4. ZamanAjansi ve Çağ Uygulamaları
İstenen 3 çağ sınıfını ve ajansı kodluyoruz:

```csharp
using System.Collections.Generic;
using System.Linq;

public class AntikMisir : Cag {
    public AntikMisir(string ad, int yil) : base(ad, yil) { }
    public override Gokyuzu Gok() => Gokyuzu.GUNESLI;
    public override Zemin Zemin() => Zemin.KUM;
    public override Hava Hava() => Hava.SAKIN;
}

public class ZamanAjansi {
    public string Ad { get; set; }
    public List<Cag> Caglar { get; private set; } = new List<Cag>();

    public void CagEkle(Cag cag) => Caglar.Add(cag);

    public List<Cag> ZamanCizelgesi() {
        // Yıla göre eskiden yeniye sıralama
        return Caglar.OrderBy(c => c.GetYil()).ToList();
    }
}
```

### Önemli Notlar ve Varsayımlar:
*   **Yılın Private Olması:** `yil` alanı `private` tanımlanarak dışarıdan doğrudan değiştirilmesi engellenmiştir (Kapsülleme). Eğer `misir.yil = 99999` yazılsaydı, verinin bütünlüğü bozulurdu; bu yüzden sadece `GetYil()` ile okuma izni veriyoruz.
*   **Arayüzler:** C#'ta `interface` kullanarak canlılara `Hareketli` veya `Isiklandirilabilir` yeteneklerini kazandırdık.
*   **Sıralama:** `ZamanCizelgesi` metodunda LINQ `OrderBy` kullanarak `GetYil()` verisi üzerinden kronolojik dizilim sağlandı.

Bu yapıları kullanarak `ZamanAjansi` nesneni oluşturabilir, içine `AntikMisir` gibi sınıfları ekleyerek `ZamanCizelgesi()` metodunu çağırabilirsin. Başarılar mimar!
