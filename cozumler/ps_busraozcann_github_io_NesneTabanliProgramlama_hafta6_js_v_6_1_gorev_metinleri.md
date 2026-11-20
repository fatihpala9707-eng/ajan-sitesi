# JS verisindeki görev metinleri (hafta6.js?v=6.1)

https://busraozcann.github.io/NesneTabanliProgramlama/hafta6.js?v=6.1#gorev-metinleri

Verilen kaynaklarda `Kitaplik` sınıfı ve `__init__` metoduna dair yapısal kurallar yer almaktadır. Talebiniz doğrultusunda, belirtilen yönergelere göre `Kitaplik` sınıfını ve `Raf` sınıfını içeren, nesnelerin birbirine bağlandığı derlenebilir C# kodu aşağıdadır.

### Çözüm ve Açıklamalar

1.  **Sınıf Yapısı:** `Kitaplik` sınıfı, `kitaplar` (dışarıdan gelen nesneler) ve `raflar` (kendi içinde üretilen nesneler) listelerini `__init__` (C# karşılığı olarak kurucu metot - Constructor) içinde tanımlar.
2.  **Nesne İlişkileri:**
    *   **Toplama (Aggregation - ◇):** `kitap_ekle` metodu ile dışarıda oluşturulan `Kitap` nesneleri listeye eklenir.
    *   **Bileşim (Composition - ◆):** `raf_tak` metodu ile `Raf` nesnesi sınıfın içinde üretilir ve `raflar` listesine eklenir.

```csharp
using System;
using System.Collections.Generic;

// Kitap sınıfı (Dışarıdan gelecek nesne türü)
public class Kitap
{
    public string Baslik { get; set; }
    public Kitap(string baslik) => Baslik = baslik;
}

// Raf sınıfı (Kitaplık tarafından üretilecek nesne)
public class Raf
{
    public int No { get; set; }
    public Raf(int no) => No = no;
}

// Ana Kitaplik sınıfı
public class Kitaplik
{
    public string Ad { get; set; }
    public List<Kitap> Kitaplar { get; private set; }
    public List<Raf> Raflar { get; private set; }

    public Kitaplik(string ad)
    {
        Ad = ad;
        // Listeler, kaynakta belirtildiği gibi gövdede değil __init__ içinde oluşturuldu
        Kitaplar = new List<Kitap>();
        Raflar = new List<Raf>();
    }

    // Toplama (Aggregation) ◇
    public void KitapEkle(Kitap kitap)
    {
        this.Kitaplar.Add(kitap);
    }

    // Bileşim (Composition) ◆
    public void RafTak(int no)
    {
        // Nesne burada üretildiği için kitaplık ile doğrudan bağımlıdır
        this.Raflar.Add(new Raf(no));
    }
}

// Kullanım Örneği
class Program
{
    static void Main()
    {
        Kitaplik kütüphanem = new Kitaplik("Merkez Kütüphane");
        
        // Toplama: Dışarıda üretilip ekleniyor
        Kitap yeniKitap = new Kitap("Nesne Tabanlı Programlama");
        kütüphanem.KitapEkle(yeniKitap);
        
        // Bileşim: İçeride üretiliyor
        kütüphanem.RafTak(101);
        
        Console.WriteLine($"{kütüphanem.Ad} kuruldu. Raf sayısı: {kütüphanem.Raflar.Count}");
    }
}
```

**Not:** Kaynaklarda paylaşılan UML ve sınıf tasarım kurallarına sadık kalınarak; `Kitaplik` sınıfının kitapları dışarıdan kabul etmesi (Aggregation) ve rafları kendi içinde oluşturarak yönetmesi (Composition) prensipleri uygulanmıştır.
