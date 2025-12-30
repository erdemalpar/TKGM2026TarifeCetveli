# TKGM 2026 Tarife Cetveli Hesaplama Aracı

Bu proje, **Tapu ve Kadastro Genel Müdürlüğü (TKGM) 2026 Yılı (I) Sayılı Tarife Cetveli** baz alınarak geliştirilmiş, modern ve kullanıcı dostu bir hesaplama aracıdır. Tapu, Kadastro, Harita ve Veri Paylaşımı gibi hizmet kalemlerinin işlem ücretlerini, yöresel katsayılar ve özel kurallar çerçevesinde otomatik olarak hesaplar.

🔗 **Canlı Demo:** [https://erdemalpar.github.io/TKGM2026TarifeCetveli/](https://erdemalpar.github.io/TKGM2026TarifeCetveli/)

## 🚀 Özellikler

*   **Kapsamlı Veri Seti:** 2026 yılı tarife cetvelindeki tüm maddeler (Tapu, Kadastro, Kontrollük, Bilgi Belge, Veri Paylaşımı, Raporlar vb.) eksiksiz olarak entegre edilmiştir.
*   **Akıllı Hesaplama Motoru:**
    *   **Yöresel Katsayı:** Kullanıcının girdiği katsayıya göre tüm fiyatları dinamik günceller.
    *   **İlave İşlemler:** Çoklu taşınmaz işlemlerinde `(n-1)` gibi karmaşık formülleri uygular.
    *   **Minimum Ücret Kontrolü:** Kadastro işlemlerinde `1.504 TL` minimum ücret kuralını otomatik işletir.
*   **Kullanıcı Dostu Arayüz:**
    *   Kategorize edilmiş akordiyon (açılır/kapanır) yapısı.
    *   Hızlı arama (Madde kodu veya açıklama ile).
    *   Anlık toplam tahakkuk görüntüleme.
    *   Maddeye özel uyarılar ve bilgi notları.
*   **Modern Teknoloji:** React, Vite ve TailwindCSS ile geliştirilmiş hızlı ve responsive yapı.

## 🛠️ Kullanılan Teknolojiler

*   **React 18:** UI kütüphanesi
*   **Vite:** Hızlı build aracı ve geliştirme sunucusu
*   **TailwindCSS:** Modern CSS framework'ü
*   **Lucide React:** İkon seti

## 📦 Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için:

1.  Repoyu klonlayın:
    ```bash
    git clone https://github.com/erdemalpar/TKGM2026TarifeCetveli.git
    cd TKGM2026TarifeCetveli
    ```

2.  Bağımlılıkları yükleyin:
    ```bash
    npm install
    ```

3.  Geliştirme sunucusunu başlatın:
    ```bash
    npm run dev
    ```
    Tarayıcınızda `http://localhost:5173` adresine gidin.

## 🌐 Dağıtım (Deployment)

Proje GitHub Pages üzerinde çalışacak şekilde yapılandırılmıştır. Güncelleme yapmak için:

```bash
npm run deploy
```

Bu komut projeyi `build` eder ve `gh-pages` dalına gönderir.

## 📄 Lisans

Bu proje MIT lisansı ile lisanslanmıştır. Veriler TKGM 2026 Yılı Resmi Gazete yayınından alınmıştır.
