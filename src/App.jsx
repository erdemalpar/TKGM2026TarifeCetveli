import React, { useState, useMemo } from 'react';
import { Search, Calculator, FileText, ChevronDown, ChevronUp, Info, ExternalLink } from 'lucide-react';

const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [yoreselKatsayi, setYoreselKatsayi] = useState(1.0);
    const [expandedSections, setExpandedSections] = useState({ 1: true });
    const [quantities, setQuantities] = useState({});

    // Temel Sabitler (PDF Sayfa 1)
    const GOSTERGE = 2227.00;
    const ILAVE_GOSTERGE = 307.00;

    // Tüm Ana ve Alt Maddeleri İçeren Tam Veri Seti
    const tariffData = [
        {
            id: 1,
            title: "TAPU İŞLEMLERİ",
            page: 2,
            items: [
                { code: "1.1.1.1", desc: "Kat irtifakı/mülkiyeti tek talep (Bağımsız bölüm başına)", type: "formula", calc: (qty) => qty * GOSTERGE * yoreselKatsayi, unit: "Adet", page: 2 },
                { code: "1.1.2.1", desc: "Bir adet taşınmaz satışı/bağışı vb.", type: "formula", calc: (qty) => qty * GOSTERGE * yoreselKatsayi, unit: "Adet", page: 2 },
                { code: "1.2.1", desc: "Bir adet taşınmaz ipotek tesisi", type: "formula", calc: (qty) => qty * GOSTERGE * yoreselKatsayi, unit: "Adet", page: 2 },
                { code: "1.10.1", desc: "Kimlik bilgileri güncelleme (Zeminde inceleme)", type: "fixed", price: 2215.00, unit: "İşlem", page: 3 },
                { code: "1.11", desc: "Yabancıların taraf olduğu işlemler (İlave maktu)", type: "fixed", price: 20868.00, unit: "Taşınmaz", page: 3 },
                { code: "1.12", desc: "Tapu senedi/İpotek belgesi sureti", type: "fixed", price: 128.00, unit: "Belge", page: 3 },
                { code: "1.13", desc: "Kayıt örneği (TMK 1020)", type: "fixed", price: 307.00, unit: "Taşınmaz", page: 3 }
            ]
        },
        {
            id: 2,
            title: "KADASTRO İŞLEMLERİ",
            page: 3,
            items: [
                { code: "2.1.1", desc: "Aplikasyon (1 - 1.000 m²)", type: "formula", calc: (qty) => 2443.00 * yoreselKatsayi, unit: "Parsel", page: 3 },
                { code: "2.1.2", desc: "Aplikasyon (1.000 - 3.000 m²)", type: "formula", calc: (qty) => 3676.00 * yoreselKatsayi, unit: "Parsel", page: 3 },
                { code: "2.2.1.1", desc: "Cins Değişikliği (Yapısız -> Yapılı, 1-1.000 m²)", type: "formula", calc: (qty) => 4018.00 * yoreselKatsayi, unit: "Parsel", page: 4 },
                { code: "2.4.1", desc: "İrtifak Hakkı Tesisi/Terkini", type: "fixed", price: 2008.00, unit: "Parsel", page: 5 },
                { code: "2.5.1", desc: "Parselin Yerinde Gösterilmesi", type: "fixed", price: 1003.00, unit: "Parsel", page: 5 }
            ]
        },
        {
            id: 3,
            title: "DENGELEME HESAP KONTROLLERİ",
            page: 8,
            items: [
                { code: "3.1", desc: "Klasik ağ dengelemesi, uyuşum testleri ve dilim dönüşüm hesabı", type: "fixed", price: 1609.00, unit: "İşlem", page: 8 },
                { code: "3.2.1", desc: "GNSS Ana nirengi noktası (Adet başına)", type: "fixed", price: 1428.00, unit: "Nokta", page: 8 },
                { code: "3.2.2", desc: "GNSS Diğer nirengi noktaları (Adet başına)", type: "fixed", price: 562.00, unit: "Nokta", page: 8 },
                { code: "3.2.3", desc: "GNSS Poligon noktaları (Adet başına)", type: "fixed", price: 235.00, unit: "Nokta", page: 8 },
                { code: "3.3.1", desc: "Hesap Kontrolü: Ana nirengi noktası", type: "fixed", price: 773.00, unit: "Nokta", page: 8 },
                { code: "3.3.5", desc: "Dönüşüm parametresi hesabı veya kontrolü", type: "fixed", price: 955.00, unit: "İşlem", page: 8 }
            ]
        },
        {
            id: 4,
            title: "BİLGİ VE BELGE TALEPLERİ",
            page: 9,
            items: [
                { code: "4.1.1", desc: "Ölçü Krokileri örneği (Sayfa başı)", type: "fixed", price: 307.00, unit: "Sayfa", page: 9 },
                { code: "4.2.1", desc: "Parsel Köşe Koordinatları (1-500 nokta arası)", type: "formula", calc: (qty) => qty * 29.00, unit: "Nokta", page: 9 },
                { code: "4.4.1", desc: "TUTGA noktası koordinat değeri", type: "fixed", price: 1773.00, unit: "Nokta", page: 9 },
                { code: "4.4.6.1", desc: "Sayısal Harita Standart Pafta Bedeli", type: "fixed", price: 6686.00, unit: "Pafta", page: 10 }
            ]
        },
        {
            id: 5,
            title: "MALVARLIĞI ARAŞTIRMALARI",
            page: 10,
            items: [
                { code: "5.1", desc: "Yazılı belge ibrazı ile malvarlığı araştırması (Kişi başı)", type: "fixed", price: 2170.00, unit: "Kişi", page: 10 }
            ]
        },
        {
            id: 6,
            title: "VERİ PAYLAŞIMI (TAKBİS/Web-Tapu)",
            page: 10,
            items: [
                { code: "6.1.1.1", desc: "Kamu Kurum Sorgulama Metodu", type: "fixed", price: 0.72, unit: "Sorgu", page: 10 },
                { code: "6.1.2.1", desc: "Kamu Dışı Sorgulama Metodu", type: "fixed", price: 17.00, unit: "Sorgu", page: 10 },
                { code: "6.2.2", desc: "Web Tapu Parsel/Taşınmaz Sorgulama (Olumlu)", type: "fixed", price: 147.00, unit: "Sorgu", page: 11 }
            ]
        },
        {
            id: 7,
            title: "DİĞER İŞ VE İŞLEMLER",
            page: 11,
            items: [
                { code: "7.1", desc: "İhale şartnamesi veya ön yeterlilik dokümanı", type: "fixed", price: 6686.00, unit: "Doküman", page: 11 },
                { code: "7.2", desc: "Kalibrasyon ücreti", type: "fixed", price: 2322.00, unit: "İşlem", page: 11 },
                { code: "7.3", desc: "Elektronik takeometre kiralanması (Günlük)", type: "fixed", price: 1670.00, unit: "Gün", page: 11 },
                { code: "7.4", desc: "GNSS alıcısı kiralanması (Günlük)", type: "fixed", price: 3300.00, unit: "Gün", page: 11 },
                { code: "7.5", desc: "Her türlü ölçü, hesap, çizim araştırılması (Saatlik)", type: "fixed", price: 369.00, unit: "Saat", page: 11 },
                { code: "7.6.1.1", desc: "Paftanın taranarak teslim edilmesi", type: "fixed", price: 1230.00, unit: "Pafta", page: 11 },
                { code: "7.7.1", desc: "LİHKAB Lisans veya kimlik belgesi", type: "fixed", price: 6956.00, unit: "Belge", page: 11 }
            ]
        },
        {
            id: 8,
            title: "ELEKTRONİK ORTAMDA VERİ PAYLAŞIMI",
            page: 12,
            items: [
                { code: "8.2.1", desc: "100 adet sorgulama kontörü aboneliği", type: "fixed", price: 1306.00, unit: "Paket", page: 12 },
                { code: "8.3.1", desc: "Onaysız parsel geometrisi (Aboneliksiz çevrimiçi)", type: "fixed", price: 211.00, unit: "Sorgu", page: 12 },
                { code: "8.7.2.1", desc: "Ana taşınmaz satış analiz raporu", type: "fixed", price: 955.00, unit: "Rapor", page: 13 }
            ]
        },
        {
            id: 9,
            title: "HARİTA KADASTRO DANIŞMANLIK TALEPLERİ",
            page: 14,
            items: [
                { code: "9.1", desc: "Personel başına günlük danışmanlık ücreti", type: "fixed", price: 5678.00, unit: "Gün/Personel", page: 14 }
            ]
        },
        {
            id: 10,
            title: "CETVELDE BULUNMAYAN HİZMETLER",
            page: 14,
            items: [
                { code: "10.0", desc: "BHİKPK veya benzer organizasyonlarca belirlenen maliyetler", type: "fixed", price: 0.0, unit: "Maliyet + Vergi", page: 14 }
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
    }, [searchTerm]);

    const handleQtyChange = (code, val) => {
        setQuantities(prev => ({ ...prev, [code]: parseFloat(val) || 0 }));
    };

    const showPdfPreview = (item) => {
        const overlay = document.createElement('div');
        overlay.className = "fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200";
        overlay.innerHTML = `
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform scale-95 opacity-0 animate-in zoom-in slide-in-from-bottom-4 duration-300 fill-mode-forwards" style="animation-fill-mode: forwards;">
        <div class="p-8 text-center">
          <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <h3 class="text-2xl font-bold text-slate-900 mb-3">Madde Detayı</h3>
          <p class="text-slate-600 mb-1 leading-relaxed">Aradığınız madde <b>2026 Yılı Tarife Cetveli</b> içerisinde yer almaktadır.</p>
          <div class="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 inline-block">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Döküman Konumu</span>
            <span class="text-lg font-bold text-blue-700">Sayfa ${item.page}, Madde ${item.code}</span>
          </div>
          <button id="closeBtn" class="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95">Anladım, Kapat</button>
        </div>
      </div>
    `;
        document.body.appendChild(overlay);
        document.getElementById('closeBtn').onclick = () => {
            overlay.classList.add('fade-out');
            setTimeout(() => document.body.removeChild(overlay), 200);
        };
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans antialiased pb-20">
            {/* Navbar / Header */}
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
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Madde ara..."
                                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl flex items-center gap-3">
                            <span className="text-[10px] font-bold text-blue-400 uppercase">Yöresel Katsayı:</span>
                            <input
                                type="number"
                                step="0.1"
                                className="bg-transparent text-blue-700 font-bold w-12 outline-none text-sm"
                                value={yoreselKatsayi}
                                onChange={(e) => setYoreselKatsayi(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Grid */}
            <main className="max-w-6xl mx-auto mt-8 px-4 space-y-4">
                {filteredData.map(section => (
                    <div key={section.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                        <button
                            onClick={() => toggleSection(section.id)}
                            className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-black text-slate-200 group-hover:text-blue-200 transition-colors">
                                    {section.id.toString().padStart(2, '0')}
                                </span>
                                <h2 className="text-sm md:text-base font-bold text-slate-800 uppercase tracking-wide">
                                    {section.title}
                                </h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="hidden md:inline text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md italic">Sayfa {section.page}</span>
                                {expandedSections[section.id] ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
                            </div>
                        </button>

                        {expandedSections[section.id] && (
                            <div className="overflow-x-auto border-t border-slate-100">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                            <th className="px-6 py-3">Kod</th>
                                            <th className="px-6 py-3">Açıklama</th>
                                            <th className="px-6 py-3">Miktar / Birim</th>
                                            <th className="px-6 py-3 text-right">Tahakkuk</th>
                                            <th className="px-6 py-3 text-center">Belge</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {section.items.map(item => {
                                            const qty = quantities[item.code] || 0;
                                            const totalPrice = item.type === 'fixed' ? item.price * (qty || 1) : item.calc(qty || 1);

                                            return (
                                                <tr key={item.code} className="hover:bg-blue-50/20 transition-colors">
                                                    <td className="px-6 py-4 font-mono font-bold text-blue-600/70">{item.code}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-slate-700">{item.desc}</div>
                                                        {item.code === "10.0" && <div className="text-[10px] text-amber-600 font-bold mt-1">Özel sözleşme/maliyet esaslı</div>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                placeholder="1"
                                                                min="1"
                                                                className="w-16 px-2 py-1 bg-slate-100 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-blue-400"
                                                                onChange={(e) => handleQtyChange(item.code, e.target.value)}
                                                            />
                                                            <span className="text-[10px] text-slate-400 font-medium italic">{item.unit}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`font-bold ${qty > 0 ? 'text-blue-700' : 'text-slate-900'}`}>
                                                            {formatCurrency(totalPrice)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => showPdfPreview(item)}
                                                            className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </button>
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

            {/* Floating Info Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-6 z-50">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-2 rounded-xl hidden sm:block">
                        <Calculator size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Genel Bilgi</p>
                        <p className="text-xs text-slate-200">Gösterge: {formatCurrency(GOSTERGE)} | İlave: {formatCurrency(ILAVE_GOSTERGE)}</p>
                    </div>
                </div>
                <div className="text-right border-l border-slate-700 pl-6">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none mb-1">Hesaplama</p>
                    <p className="text-[9px] text-slate-500 italic">KDV Dahil / 2026 Mevzuatı</p>
                </div>
            </div>
        </div>
    );
};

export default App;
