import React, { useState, useMemo } from 'react';
import { Search, Calculator, FileText, ChevronDown, ChevronUp, Info, ExternalLink, AlertTriangle } from 'lucide-react';

const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [yoreselKatsayi, setYoreselKatsayi] = useState(1.0);
    const [expandedSections, setExpandedSections] = useState({ 1: true, 2: true, 3: false, 4: false, 6: false, 7: false, 8: false, 9: false });
    const [quantities, setQuantities] = useState({});

    // --- SABİTLER VE TANIMLAR (2026 Yılı Cetveli) ---
    const GOSTERGE = 2227.00;        // İşlem Ücreti Göstergesi
    const ILAVE_GOSTERGE = 307.00;   // İlave Gösterge
    const MIN_KADASTRO_UCRETI = 1504.00; // Kadastro min. ücret

    /**
     * HESAPLAMA YARDIMCILARI
     */
    const getIslemUcreti = () => GOSTERGE * yoreselKatsayi;
    const getIlaveUcret = () => ILAVE_GOSTERGE * yoreselKatsayi;

    // --- VERİ SETİ (Tam Liste - TÜM RESİMLER) ---
    const tariffData = [
        {
            id: 1,
            title: "TAPU İŞLEMLERİ",
            page: 2,
            note: "Genel Prensip: İşlem Ücreti = 2.227 TL x Yöresel Katsayı",
            items: [
                { code: "1.1.1.1", desc: "Kat irtifakı/mülkiyeti - Tek Bağımsız Bölüm", type: "formula", calc: (qty) => qty * getIslemUcreti(), unit: "Bölüm Sayısı" },
                { code: "1.1.1.2", desc: "Çoklu mülkiyet/vasıflı taşınmazın birlikte satışı", type: "formula", calc: (qty) => getIslemUcreti() + (Math.max(0, qty - 1) * getIlaveUcret()), unit: "Toplam Taşınmaz" },
                { code: "1.1.2.1", desc: "Bir adet taşınmaz satışı (Arsa/Tarla vb.)", type: "formula", calc: (qty) => qty * getIslemUcreti(), unit: "İşlem" },
                { code: "1.1.2.2", desc: "Birden fazla taşınmazın TEK TALEPTE satışı", type: "formula", calc: (qty) => getIslemUcreti() + (Math.max(0, qty - 1) * getIlaveUcret()), unit: "Taşınmaz Sayısı" },
                { code: "1.1.3.1", desc: "Bir adet devre mülk işlemi", type: "formula", calc: (qty) => qty * getIslemUcreti(), unit: "İşlem" },
                { code: "1.1.3.2", desc: "Birden fazla devre mülk (Tek Talep)", type: "formula", calc: (qty) => getIslemUcreti() + (Math.max(0, qty - 1) * getIlaveUcret()), unit: "Devre Mülk Sayısı" },
                { code: "1.2.1", desc: "İpotek tesisi (Tek taşınmaz)", type: "formula", calc: (qty) => qty * getIslemUcreti(), unit: "İşlem" },
                { code: "1.2.2", desc: "İpotek tesisi (Çoklu taşınmaz)", type: "formula", calc: (qty) => getIslemUcreti() + (Math.max(0, qty - 1) * getIlaveUcret()), unit: "Taşınmaz Sayısı" },
                { code: "1.2.3", desc: "İpotek derecesi değişikliği/Temlik/Teminat İlavesi", type: "formula", calc: (qty) => qty * getIslemUcreti(), unit: "İşlem" },
                { code: "1.3.1", desc: "Satış ve İpotek Tesisinin Tek Talepte Yapılması (1 Taşınmaz)", type: "formula", calc: (qty) => qty * 2 * getIslemUcreti(), unit: "İşlem", info: "2 İşlem Ücreti" },
                { code: "1.3.2", desc: "Satış + İpotek (Çoklu taşınmaz)", type: "formula", calc: (qty) => (getIslemUcreti() + (Math.max(0, qty - 1) * getIlaveUcret())) * 2, unit: "Taşınmaz Sayısı" },
                { code: "1.4", desc: "Taksim, Ayni Sermaye, İrtifak, Cins Değişikliği (Tapu)", type: "formula", calc: (qty) => getIslemUcreti() + (Math.max(0, qty - 1) * getIlaveUcret()), unit: "Taşınmaz Sayısı" },
                { code: "1.5", desc: "Kat İrtifakı Tesisi, Doğrudan K.Mülkiyeti (Ferdileşme)", type: "formula", calc: (qty) => getIslemUcreti() + (Math.max(0, qty - 1) * getIlaveUcret()), unit: "Bağımsız Bölüm" },
                { code: "1.6", desc: "Yetki alanı dışı işlemler (Yurt içi)", type: "formula", calc: (qty) => qty * getIslemUcreti() * 2, unit: "İşlem", info: "2 Katı Alınır" },
                { code: "1.7", desc: "Yurt dışı tapu işlemleri", type: "formula", calc: (qty) => qty * getIslemUcreti() * 4, unit: "İşlem", info: "4 Katı Alınır" },
                { code: "1.8", desc: "Farklı tapu müdürlükleri/yurt dışı birim devri", type: "formula", calc: (qty) => qty * getIslemUcreti() * 4, unit: "İşlem", info: "4 Katı Alınır" },
                { code: "1.9", desc: "Hatalı B.Bölüm/Blok Numarası Düzeltme", type: "formula", calc: (qty) => getIslemUcreti() + (Math.max(0, qty - 1) * getIlaveUcret()), unit: "Bölüm/Blok Sayısı" },
                { code: "1.10.1", desc: "Kimlik güncelleme (Zeminde inceleme)", type: "fixed", price: 2215.00, unit: "İşlem", info: "Maktu" },
                { code: "1.10.2", desc: "Kimlik güncelleme (Çoklu taşınmaz)", type: "formula", calc: (qty) => 2215.00 + (Math.max(0, qty - 1) * ILAVE_GOSTERGE), unit: "Taşınmaz", info: "2.215 + Ekler" },
                { code: "1.11", desc: "Yabancıların taraf olduğu işlemler (Ek Maktu)", type: "fixed", price: 20868.00, unit: "Taşınmaz", info: "Ek Maktu Ücret" },
                { code: "1.12", desc: "Suret (Tapu/İpotek belgesi) - YK Yok", type: "fixed", price: 128.00, unit: "Belge", info: "Maktu" },
                { code: "1.13", desc: "İlgisini inanılır kılanlara kayıt/belge örneği", type: "fixed", price: 307.00, unit: "Taşınmaz/Sayfa", info: "Maktu" },
                { code: "1.14", desc: "Mahkeme kararlarının tescili", type: "formula", calc: (qty) => qty * getIslemUcreti(), unit: "İşlem" },
                { code: "1.15", desc: "DİĞER İŞLEMLER (Kamulaştırma, İntikal, Düzeltme vb.)", type: "formula", calc: (qty) => qty * getIslemUcreti(), unit: "İşlem" },
            ]
        },
        {
            id: 2,
            title: "KADASTRO İŞLEMLERİ",
            page: 4,
            note: "Talebe bağlı işlemlerde min. ücret 1.504 TL'dir.",
            items: [
                { code: "2.1.1", desc: "Aplikasyon (1 - 1.000 m²)", type: "kadastro_formula", basePrice: 2443.00, unit: "Parsel" },
                { code: "2.1.2", desc: "Aplikasyon (1.001 - 3.000 m²)", type: "kadastro_formula", basePrice: 3676.00, unit: "Parsel" },
                { code: "2.1.3", desc: "Aplikasyon (3.001 - 5.000 m²)", type: "kadastro_formula", basePrice: 7355.00, unit: "Parsel" },
                { code: "2.1.4", desc: "Aplikasyon (5.001 - 10.000 m²)", type: "kadastro_formula", basePrice: 9794.00, unit: "Parsel" },
                { code: "2.1.5", desc: "Aplikasyon (10.001 - 20.000 m²)", type: "kadastro_formula", basePrice: 13474.00, unit: "Parsel" },
                { code: "2.1.6", desc: "Aplikasyon (20.001 - 50.000 m²)", type: "kadastro_formula", basePrice: 17590.00, unit: "Parsel" },
                { code: "2.1.7", desc: "Aplikasyon (50.001 - 100.000 m²)", type: "kadastro_formula", basePrice: 21389.00, unit: "Parsel" },
                { code: "2.1.8", desc: "Aplikasyon (100.001 - 200.000 m²)", type: "kadastro_formula", basePrice: 24508.00, unit: "Parsel" },
                { code: "2.1.9", desc: "Aplikasyon (200.001 - 500.000 m²)", type: "kadastro_formula", basePrice: 29389.00, unit: "Parsel" },
                { code: "2.1.10", desc: "Aplikasyon (>500.000 m²)", type: "kadastro_formula", basePrice: 2008.00, unit: "İlave 100bin m²", info: "2.1.9'a EK" },
                { code: "2.2.1.1", desc: "Cins Değ. (Yapısız->Yapılı 1-1.000 m²)", type: "kadastro_formula", basePrice: 4018.00, unit: "Parsel" },
                { code: "2.2.1.2", desc: "Cins Değ. (Yapısız->Yapılı 1.001-3.000 m²)", type: "kadastro_formula", basePrice: 5550.00, unit: "Parsel" },
                { code: "2.2.1.3", desc: "Cins Değ. (Yapısız->Yapılı >3.000 m²)", type: "kadastro_formula", basePrice: 509.00, unit: "İlave 1000m²", info: "İlave Her 1000m2" },
                { code: "2.2.1.4.3", desc: "Tarımsal Amaçlı Bina Cins Değişikliği (Tavan)", type: "fixed", price: 12762.00, unit: "İşlem", info: "Tavan Ücret" },
                { code: "2.2.1.4.4", desc: "Aynı yapı üzerinde kat ilavesi", type: "fixed", price: 2170.00, unit: "İşlem", info: "Maktu" },
                { code: "2.2.1.4.5", desc: "Birden fazla yapı varsa her yapının kat ilavesi", type: "fixed", price: 1023.00, unit: "İşlem", info: "Maktu" },
                { code: "2.2.1.4.7", desc: "Birden fazla bina varsa, fazla olan her bir yapı", type: "fixed", price: 1033.00, unit: "İlave Bina", info: "Maktu" },
                { code: "2.2.1.4.8", desc: "Yaygın kat mülkiyeti olmayan/değişik zamanlı binalar", type: "fixed", price: 1609.00, unit: "Bina", info: "Maktu" },
                { code: "2.2.2", desc: "Yapılı iken yapısız hale gelme (Yıkım)", type: "fixed", price: 1033.00, unit: "Parsel", info: "Maktu" },
                { code: "2.2.3", desc: "Yapı ile ilgisi olmayan vasıf değişikliği", type: "kadastro_formula", basePrice: 1003.00, unit: "Parsel", info: "2.5.1 ile aynı" },
                { code: "2.3.1", desc: "Birleştirme (Tevhit)", type: "formula", calc: (qty) => (qty - 1) * 2227.00, unit: "Birleşen Parsel", info: "(n-1) * 2.227" },
                { code: "2.4.1", desc: "İrtifak Hakkı Tesisi/Terkini (Kadastro)", type: "fixed", price: 2008.00, unit: "Parsel", info: "Maktu" },
                { code: "2.5.1", desc: "Parselin Yerinde Gösterilmesi", type: "fixed", price: 1003.00, unit: "Parsel", info: "Maktu" },
                { code: "2.5.2", desc: "Bağımsız bölüm yerinde tespiti", type: "fixed", price: 1003.00, unit: "Bölüm", info: "Maktu" },
                { code: "2.5.3", desc: "Bitişik parsel/bölüm yerinde gösterme (İlave)", type: "fixed", price: 338.00, unit: "İlave Adet", info: "Maktu" },
                { code: "2.5.4.1", desc: "Muhdesatın terkini (2.2.2 + 2.5.1 toplamı)", type: "fixed", price: 2036.00, unit: "İşlem", info: "Maktu" },
                { code: "2.6.1", desc: "Hatalı B.Bölüm Düzeltme (2 bölüme kadar)", type: "fixed", price: 2227.00, unit: "İşlem", info: "Maktu" },
                { code: "2.6.2", desc: "Hatalı B.Bölüm Düzeltme (2'den fazla ise ilave)", type: "fixed", price: 338.00, unit: "İlave Adet", info: "Maktu" },
                { code: "2.6.3", desc: "Hatalı Blok adı/numarası düzeltme", type: "fixed", price: 2227.00, unit: "Blok", info: "Maktu" },
                { code: "2.7.1", desc: "Öncelikli Kadastro İşlemleri (Talep edilen yıl maliyetine %10 ilave)", type: "fixed", price: 0.0, unit: "Maliyet+%10", info: "Maliyet + %10" },
                { code: "2.8.2", desc: "Mera aplikasyon (Kontrol bedeli)", type: "fixed", price: 0.0, unit: "B.Fiyat", info: "Aplikasyon %10" },
                { code: "2.9.1", desc: "Kadastral Yol Sınırı (10 noktaya kadar)", type: "fixed", price: 4971.00, unit: "İşlem", info: "Maktu" },
                { code: "2.9.2", desc: "Kadastral Yol Sınırı (10 noktadan sonra)", type: "fixed", price: 235.00, unit: "İlave Nokta", info: "Maktu" },
                { code: "2.10", desc: "Mahkeme Kararlarının İnfazı (Kadastro)", type: "fixed", price: 3108.00, unit: "İşlem", info: "Maktu" },
                { code: "2.11.1.2.1", desc: "Parselasyon Kontrolü (1-100.000 m²)", type: "kadastro_formula", basePrice: 3177.00, unit: "Hektar", info: "Hektar Başına" },
                { code: "2.11.1.2.2", desc: "Parselasyon Kontrolü (100.001-500.000 m² - İlave)", type: "kadastro_formula", basePrice: 2678.00, unit: "Hektar", info: "İlave Hektar" },
                { code: "2.11.1.2.3", desc: "Parselasyon Kontrolü (500.001-1.000.000 m² - İlave)", type: "kadastro_formula", basePrice: 2347.00, unit: "Hektar", info: "İlave Hektar" },
                { code: "2.11.1.2.4", desc: "Parselasyon Kontrolü (1.000.001-1.500.000 m² - İlave)", type: "kadastro_formula", basePrice: 1354.00, unit: "Hektar", info: "İlave Hektar" },
                { code: "2.11.1.2.5", desc: "Parselasyon Kontrolü (>1.500.000 m² - İlave)", type: "kadastro_formula", basePrice: 338.00, unit: "Hektar", info: "İlave Hektar" },
                { code: "2.11.2.1.1", desc: "Ayırma/Yola Terk Kontrol (1-3.000 m²)", type: "kadastro_formula", basePrice: 2106.00, unit: "İşlem", info: "Toplam" },
                { code: "2.11.2.1.2", desc: "Ayırma/Yola Terk Kontrol (3.001-5.000 m²)", type: "kadastro_formula", basePrice: 665.00, unit: "Her 1000m²", info: "İlave" },
                { code: "2.11.2.1.3", desc: "Ayırma/Yola Terk Kontrol (5.001-10.000 m²)", type: "kadastro_formula", basePrice: 498.00, unit: "Her 1000m²", info: "İlave" },
                { code: "2.11.2.1.4", desc: "Ayırma/Yola Terk Kontrol (10.001-100.000 m²)", type: "kadastro_formula", basePrice: 420.00, unit: "Her Hektar", info: "İlave" },
                { code: "2.11.2.2.1", desc: "Kadastro parseli ayırma/terk (<20.000 m²)", type: "kadastro_formula", basePrice: 1772.00, unit: "İşlem", info: "Toplam" },
                { code: "2.11.2.2.2", desc: "Kadastro parseli ayırma/terk (20.001-100.000 m²)", type: "kadastro_formula", basePrice: 240.00, unit: "Her Hektar", info: "İlave" },
                { code: "2.11.3.1", desc: "Ayırma sonucu parsel sayısı > 2 ise ilave", type: "kadastro_formula", basePrice: 461.00, unit: "İlave Parsel", info: "İlave Parsel Başına" },
                { code: "2.11.4", desc: "Maden/Taş ocağı vb. harita kontrolü", type: "kadastro_formula", basePrice: 478.00, unit: "Hektar", info: "Hektar Başına" },
                { code: "2.11.5.1.1", desc: "Şeritvari Kamulaştırma Harita Kontrol", type: "fixed", price: 4028.00, unit: "Km", info: "Maktu" },
                { code: "2.11.5.1.2", desc: "Şeritvari Harita Yer Kontrol Noktası", type: "fixed", price: 892.00, unit: "Km", info: "Maktu" },
                { code: "2.11.5.2.1", desc: "Hektar Bazlı Kamulaştırma Harita Kontrol", type: "kadastro_formula", basePrice: 892.00, unit: "Hektar", info: "Hektar Başına" },
                { code: "2.11.5.2.2", desc: "Hektar Bazlı Harita Nokta Değeri", type: "kadastro_formula", basePrice: 338.00, unit: "Hektar", info: "Hektar Başına" },
                { code: "2.11.6.1", desc: "İmar Planına Bağlı Mülkiyet Raporu", type: "fixed", price: 235.00, unit: "Parsel", info: "Maktu" },
                { code: "2.11.6.2", desc: "Parselasyon/Toplulaştırma Mülkiyet Raporu", type: "fixed", price: 166.00, unit: "Ha/Km", info: "Maktu" },
                { code: "2.11.6.3", desc: "Şeritvari Kamulaştırma Mülkiyet Raporu", type: "fixed", price: 427.00, unit: "Km", info: "Maktu" },
            ]
        },
        {
            id: 3,
            title: "DENGELEME HESAP KONTROLLERİ",
            page: 8,
            items: [
                { code: "3.1", desc: "Klasik ağ dengelemesi, uyuşum testleri", type: "fixed", price: 1609.00, unit: "İşlem" },
                { code: "3.2.1", desc: "GNSS Ana nirengi noktası", type: "fixed", price: 1428.00, unit: "Nokta", info: "Maktu" },
                { code: "3.2.2", desc: "GNSS Diğer nirengi noktaları", type: "fixed", price: 562.00, unit: "Nokta", info: "Maktu" },
                { code: "3.2.3", desc: "GNSS Poligon noktaları", type: "fixed", price: 235.00, unit: "Nokta", info: "Maktu" },
                { code: "3.3.1", desc: "Sıklaştırma: Ana nirengi noktası", type: "fixed", price: 773.00, unit: "Nokta", info: "Maktu" },
                { code: "3.3.2", desc: "Sıklaştırma: Diğer nirengi noktaları", type: "fixed", price: 192.00, unit: "Nokta", info: "Maktu" },
                { code: "3.3.3", desc: "Sıklaştırma: Poligon noktaları", type: "fixed", price: 78.00, unit: "Nokta", info: "Maktu" },
                { code: "3.3.4", desc: "Yükseklik hesabı (Adet başına)", type: "fixed", price: 192.00, unit: "Nokta", info: "Maktu" },
                { code: "3.3.5", desc: "Dönüşüm parametresi hesabı/kontrolü", type: "fixed", price: 955.00, unit: "İşlem", info: "Maktu" },
            ]
        },
        {
            id: 4,
            title: "BİLGİ VE BELGE TALEPLERİ",
            page: 9,
            items: [
                { code: "4.1.1", desc: "Ölçü Krokileri (Sayfa başı)", type: "fixed", price: 307.00, unit: "Sayfa", info: "Maktu" },
                { code: "4.1.2", desc: "Takeometrik Ölçüm Karneleri", type: "fixed", price: 143.00, unit: "Sayfa", info: "Maktu" },
                { code: "4.1.3", desc: "Aplikasyon Krokisi", type: "fixed", price: 143.00, unit: "Sayfa", info: "Maktu" },
                { code: "4.1.4", desc: "Ebatlı Kroki / Röperli Kroki", type: "fixed", price: 143.00, unit: "Sayfa", info: "Maktu" },
                { code: "4.2.1", desc: "Parsel Köşe Koord. (1-500 nokta)", type: "fixed", price: 29.00, unit: "Nokta", info: "Maktu" },
                { code: "4.2.2", desc: "Parsel Köşe Koord. (501-1000 nokta)", type: "fixed", price: 24.00, unit: "Nokta", info: "Maktu" },
                { code: "4.2.3", desc: "Parsel Köşe Koord. (>1000 nokta)", type: "fixed", price: 11.00, unit: "Nokta", info: "Maktu" },
                { code: "4.3.1", desc: "Mat Kopya (50x70)", type: "fixed", price: 518.00, unit: "Adet", info: "Maktu" },
                { code: "4.3.2", desc: "Mat Kopya (70x100)", type: "fixed", price: 720.00, unit: "Adet", info: "Maktu" },
                { code: "4.3.3", desc: "Şeffaf Kopya (50x70)", type: "fixed", price: 720.00, unit: "Adet", info: "Maktu" },
                { code: "4.3.5.1", desc: "Saydam PVC (50x70)", type: "fixed", price: 3203.00, unit: "Adet", info: "Maktu" },
                { code: "4.3.6.1", desc: "Film (50x70)", type: "fixed", price: 3393.00, unit: "Adet", info: "Maktu" },
                { code: "4.4.1", desc: "TUTGA Noktası", type: "fixed", price: 1773.00, unit: "Nokta", info: "Maktu" },
                { code: "4.4.2.1", desc: "C1 Derece Ana GPS Ağı (AGA)", type: "fixed", price: 1773.00, unit: "Nokta", info: "Maktu" },
                { code: "4.4.2.2", desc: "C2 Derece Sıklaştırma (SGA)", type: "fixed", price: 1033.00, unit: "Nokta", info: "Maktu" },
                { code: "4.4.3.1", desc: "ED-50 Ana Nirengi", type: "fixed", price: 665.00, unit: "Nokta", info: "Maktu" },
                { code: "4.4.4.1", desc: "Onaylanmış Dönüşüm Parametresi", type: "fixed", price: 2482.00, unit: "İşlem", info: "Maktu" },
                { code: "4.4.5.1", desc: "Nivelman Noktası", type: "fixed", price: 338.00, unit: "Nokta", info: "Maktu" },
                { code: "4.4.6.1", desc: "Sayısal Harita Standart Pafta Bedeli", type: "fixed", price: 6686.00, unit: "Pafta", info: "Maktu" },
                { code: "4.4.7.1.1", desc: "Belge Fotokopisi (A4)", type: "fixed", price: 1.92, unit: "Sayfa", info: "Maktu" },
                { code: "4.4.7.1.3", desc: "Dijital Kopya (Poz başına)", type: "fixed", price: 2.35, unit: "Poz", info: "Maktu" },
            ]
        },
        {
            id: 5,
            title: "MALVARLIĞI ARAŞTIRMALARI",
            page: 10,
            items: [
                { code: "5.1", desc: "Malvarlığı Araştırması (Belgeli)", type: "fixed", price: 2170.00, unit: "Kişi", info: "Maktu" }
            ]
        },
        {
            id: 6,
            title: "VERİ PAYLAŞIMI",
            page: 10,
            items: [
                { code: "6.1.1.1", desc: "Kamu Kurum Sorgulama (TAKBİS)", type: "fixed", price: 0.72, unit: "Sorgu", info: "Maktu" },
                { code: "6.1.2.1", desc: "Kamu Dışı Kurum Sorgulama", type: "fixed", price: 17.00, unit: "Sorgu", info: "Maktu" },
                { code: "6.2.2", desc: "Web Tapu Parsel/Taşınmaz Sorgulama (Olumlu)", type: "fixed", price: 147.00, unit: "Sorgu", info: "Maktu" },
                { code: "6.2.3", desc: "Tescilsiz edinim / Bilirkişi Değerleme Amaçlı", type: "fixed", price: 307.00, unit: "Taşınmaz", info: "Maktu" }
            ]
        },
        {
            id: 7,
            title: "DİĞER İŞ VE İŞLEMLER",
            page: 11,
            items: [
                { code: "7.1", desc: "İhale şartnamesi veya ön yeterlilik dokümanı", type: "fixed", price: 6686.00, unit: "Doküman", info: "Maktu" },
                { code: "7.2", desc: "Kalibrasyon ücreti", type: "fixed", price: 2322.00, unit: "İşlem", info: "Maktu" },
                { code: "7.3", desc: "Elektronik takeometre kiralama (Günlük)", type: "fixed", price: 1670.00, unit: "Gün", info: "Maktu" },
                { code: "7.4", desc: "GNSS alıcısı kiralama (Günlük)", type: "fixed", price: 3300.00, unit: "Gün", info: "Maktu" },
                { code: "7.5", desc: "Her türlü ölçü, hesap, çizim araştırılması (Saatlik)", type: "fixed", price: 369.00, unit: "Saat", info: "Maktu" },
                { code: "7.6.1.1", desc: "Paftanın taranarak teslimi (Pafta bazında)", type: "fixed", price: 1230.00, unit: "Pafta", info: "Maktu" },
                { code: "7.6.1.2", desc: "Paftanın sadece taranması (Adet bazında)", type: "fixed", price: 120.00, unit: "Adet", info: "Maktu" },
                { code: "7.7.1", desc: "Lisans belgesi veya kimlik belgesi", type: "fixed", price: 6956.00, unit: "Belge", info: "Maktu" },
                { code: "7.7.2", desc: "Kaşe bedeli", type: "fixed", price: 2482.00, unit: "Adet", info: "Maktu" },
                { code: "7.7.3", desc: "Eğitim bedeli (Saat başına)", type: "fixed", price: 695.00, unit: "Saat", info: "Maktu" },
                { code: "7.9.1", desc: "Yabancılara ilişkin ayrıntılı rapor (İlk sayfa)", type: "fixed", price: 38.00, unit: "Sayfa", info: "Maktu" },
            ]
        },
        {
            id: 8,
            title: "ELEKTRONİK ORTAMDA VERİ PAYLAŞIMI",
            page: 12,
            items: [
                { code: "8.2.1", desc: "100 adet sorgulama kontörü aboneliği", type: "fixed", price: 1306.00, unit: "Paket", info: "Aylık" },
                { code: "8.2.2", desc: "200 adet sorgulama kontörü aboneliği", type: "fixed", price: 2146.00, unit: "Paket", info: "Aylık" },
                { code: "8.2.3", desc: "500 adet sorgulama kontörü aboneliği", type: "fixed", price: 4171.00, unit: "Paket", info: "Aylık" },
                { code: "8.2.4", desc: "1.000 adet sorgulama kontörü aboneliği", type: "fixed", price: 9901.00, unit: "Paket", info: "Aylık" },
                { code: "8.2.5", desc: "Sınırsız sorgulama (İlave sorgu başına)", type: "fixed", price: 7.04, unit: "Sorgu", info: "Maktu" },
                { code: "8.3.1", desc: "Onaysız coğrafi parsel geometrisi (Aboneliksiz)", type: "fixed", price: 211.00, unit: "Sorgu", info: "Maktu" },
                { code: "8.4.1", desc: "Bağımsız bölüm 2D taslak geometri (Aboneliksiz)", type: "fixed", price: 141.00, unit: "Sorgu", info: "Maktu" },
                { code: "8.5.1", desc: "3 Boyutlu bağımsız bölüm planı (Aboneliksiz)", type: "fixed", price: 141.00, unit: "Sorgu", info: "Maktu" },
                { code: "8.6.1", desc: "Bağımsız bölüm kat planı raster (Aboneliksiz)", type: "fixed", price: 141.00, unit: "Sorgu", info: "Maktu" },
                { code: "8.7.1.1", desc: "Onaylı parsel teknik belge raporu (Aboneliksiz)", type: "fixed", price: 29.00, unit: "Nokta Basına", info: "Maktu" },
                { code: "8.7.2.1", desc: "Ana taşınmaz satış analiz raporu (Aboneliksiz)", type: "fixed", price: 955.00, unit: "Rapor", info: "Maktu" },
                { code: "8.7.3.1", desc: "Bağımsız bölüm satış analiz raporu (Aboneliksiz)", type: "fixed", price: 955.00, unit: "Rapor", info: "Maktu" }
            ]
        },
        {
            id: 9,
            title: "HİZMET TALEP VE DANIŞMANLIK",
            page: 14,
            items: [
                { code: "9.1", desc: "Personel başına günlük danışmanlık ücreti", type: "fixed", price: 5678.00, unit: "Gün/Personel", info: "Günlük" }
            ]
        },
        {
            id: 10,
            title: "CETVELDE BULUNMAYAN HİZMETLER",
            page: 14,
            items: [
                { code: "10.0", desc: "BHİKPK vb. kurumlarca belirlenen maliyetler", type: "fixed", price: 0.0, unit: "Maliyet + Vergi", info: "Özel Belirlenir" }
            ]
        }
    ];

    const toggleSection = (id) => {
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
    };

    const filteredData = useMemo(() => {
        if (!searchTerm) return tariffData;
        return tariffData.map(section => ({
            ...section,
            items: section.items.filter(item =>
                item.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.code.includes(searchTerm)
            )
        })).filter(section => section.items.length > 0);
    }, [searchTerm, tariffData]);

    const handleQtyChange = (code, val) => {
        setQuantities(prev => ({ ...prev, [code]: parseFloat(val) || 0 }));
    };

    const calculateTotal = (item, qty) => {
        let rawPrice = 0;

        if (item.type === 'fixed') {
            rawPrice = item.price * (qty || 1);
        } else if (item.type === 'formula') {
            rawPrice = item.calc(qty || 1);
        } else if (item.type === 'kadastro_formula') {
            const val = (item.basePrice * yoreselKatsayi) * (qty || 1);
            // Kadastro asgari ücret kontrolü
            rawPrice = Math.max(MIN_KADASTRO_UCRETI, val);
        }

        return rawPrice;
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans antialiased pb-28">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-4 shadow-sm">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <FileText className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">TKGM 2026</h1>
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter mt-1">Döner Sermaye Tarife Cetveli</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
                        <div className="relative group flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Madde ara (Örn: Rapor, 3D, Kiralama)..."
                                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl flex items-center gap-3">
                            <label className="text-[10px] font-bold text-blue-400 uppercase whitespace-nowrap">Yöresel Katsayı:</label>
                            <input
                                type="number"
                                step="0.1"
                                className="bg-transparent text-blue-700 font-bold w-12 outline-none text-sm text-center"
                                value={yoreselKatsayi}
                                onChange={(e) => setYoreselKatsayi(Math.max(0, parseFloat(e.target.value) || 0))}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto mt-6 px-4 space-y-4">
                {filteredData.map(section => (
                    <div key={section.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <button
                            onClick={() => toggleSection(section.id)}
                            className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-black text-slate-200 group-hover:text-blue-200 transition-colors">
                                    {section.id.toString().padStart(2, '0')}
                                </span>
                                <div className="text-left">
                                    <h2 className="text-sm md:text-base font-bold text-slate-800 uppercase tracking-wide">
                                        {section.title}
                                    </h2>
                                    {section.note && (
                                        <p className="text-[10px] text-slate-400 font-medium mt-1 pr-4 hidden md:block">{section.note}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {expandedSections[section.id] ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
                            </div>
                        </button>

                        {expandedSections[section.id] && (
                            <div className="overflow-x-auto border-t border-slate-100">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                            <th className="px-6 py-3 w-28">Kod</th>
                                            <th className="px-6 py-3">Açıklama</th>
                                            <th className="px-6 py-3 w-40">Miktar</th>
                                            <th className="px-6 py-3 text-right w-40">Tutar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {section.items.map(item => {
                                            const qty = quantities[item.code] || 0;
                                            const total = calculateTotal(item, qty);
                                            const isActive = qty > 0;

                                            return (
                                                <tr key={item.code} className={`transition-colors ${isActive ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                                                    <td className="px-6 py-4 font-mono font-bold text-blue-600/70 text-xs align-top pt-5">{item.code}</td>
                                                    <td className="px-6 py-4 align-top">
                                                        <div className={`font-semibold ${isActive ? 'text-blue-900' : 'text-slate-700'}`}>{item.desc}</div>
                                                        {item.info && (
                                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-600 font-bold bg-amber-50 inline-flex px-2 py-0.5 rounded-md">
                                                                <AlertTriangle size={10} />
                                                                {item.info}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 align-top">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    min="0"
                                                                    className={`w-24 px-3 py-2 border rounded-lg text-sm font-bold outline-none transition-all ${isActive ? 'border-blue-300 bg-white ring-2 ring-blue-100 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-600 focus:border-blue-400'}`}
                                                                    onChange={(e) => handleQtyChange(item.code, e.target.value)}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.unit}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right align-top pt-5">
                                                        <div className={`font-bold text-lg ${isActive ? 'text-blue-700' : 'text-slate-300'}`}>
                                                            {qty > 0 ? formatCurrency(total) : '-'}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
            </main>

            {/* Footer Summary */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toplam Tahakkuk</p>
                        <p className="text-xs text-slate-500">KDV Dahil / 2026</p>
                    </div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight">
                        {formatCurrency(
                            tariffData.reduce((acc, section) => {
                                return acc + section.items.reduce((secAcc, item) => {
                                    const q = quantities[item.code] || 0;
                                    if (q <= 0) return secAcc;
                                    return secAcc + calculateTotal(item, q);
                                }, 0);
                            }, 0)
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
