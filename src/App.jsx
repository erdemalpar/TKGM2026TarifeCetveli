import React, { useState, useMemo, useEffect } from 'react';
import { Search, FileText, ChevronDown, ChevronUp, AlertTriangle, MapPin, Database, X, Check, Copy, Upload, FileJson, Download, Table as TableIcon, Save, AlertCircle } from 'lucide-react';
import rawDefaultData from './data/defaultYoreselKatSayilar';
import { tariffData as rawTariffData } from './data/tariffData';

// PDF.js Yükleyici
const loadPdfJs = () => {
    return new Promise((resolve) => {
        if (window.pdfjsLib) {
            resolve(window.pdfjsLib);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve(window.pdfjsLib);
        };
        document.head.appendChild(script);
    });
};

// Veri Dönüştürücü (Düz Liste -> Hiyerarşik Yapı)
const transformDefaultData = (flatData) => {
    const cityMap = {};
    flatData.forEach(item => {
        if (!item.il_adi) return;
        const cityName = item.il_adi;
        if (!cityMap[cityName]) {
            cityMap[cityName] = {
                name: cityName,
                id: Object.keys(cityMap).length + 1,
                districts: []
            };
        }
        cityMap[cityName].districts.push({
            name: item.ilce_adi,
            kv: item.tapu_katsayisi,
            kadastro_kv: item.kadastro_katsayisi
        });
    });
    // Türkçe karakter uyumlu sıralama
    return Object.values(cityMap).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
};

const defaultProcessedData = transformDefaultData(rawDefaultData);

const App = () => {
    // --- STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [yoreselKatsayi, setYoreselKatsayi] = useState(1.0);

    // Şehir Verisi State'i (Her açılışta default veriyi yükler)
    const [cities, setCities] = useState(defaultProcessedData);

    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [coefficientType, setCoefficientType] = useState('tapu'); // 'tapu' | 'kadastro'
    const [expandedSections, setExpandedSections] = useState({});
    const [quantities, setQuantities] = useState({});

    // Manuel Mod Kontrolü: 1 (Tapu) ve 2 (Kadastro) dışındaki bölümlerden seçim yapılmışsa
    const isManualMode = useMemo(() => {
        for (const [code, qty] of Object.entries(quantities)) {
            if (qty > 0) {
                const section = rawTariffData.find(sec => sec.items.some(i => i.code === code));
                if (section && section.id !== 1 && section.id !== 2) {
                    return true;
                }
            }
        }
        return false;
    }, [quantities]);

    // Modal State
    const [isDataModalOpen, setIsDataModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pdfError, setPdfError] = useState(null);
    const [parsedPdfData, setParsedPdfData] = useState([]); // PDF'den okunan ham veri
    const [previewMode, setPreviewMode] = useState('json');

    // --- SABİTLER ---
    const GOSTERGE = 2227.00;
    const ILAVE_GOSTERGE = 307.00;
    const MIN_KADASTRO_UCRETI = 1504.00;

    // --- HESAPLAMA MANTIĞI ENJEKSİYONU ---
    const getIslemUcreti = () => GOSTERGE * yoreselKatsayi;
    const getIlaveUcret = () => ILAVE_GOSTERGE * yoreselKatsayi;

    const processedTariffData = useMemo(() => {
        return rawTariffData.map(section => ({
            ...section,
            items: section.items.map(item => {
                let newItem = { ...item };
                // Formül enjeksiyonu
                if (item.type === 'formula') {
                    if (item.code === "1.3.1") newItem.calc = (qty) => qty * 2 * getIslemUcreti();
                    else if (["1.3.2", "1.6"].includes(item.code)) newItem.calc = (qty) => (getIslemUcreti() + (Math.max(0, qty - 1) * getIlaveUcret())) * 2; // Basit yaklaşım
                    else if (["1.6"].includes(item.code)) newItem.calc = (qty) => qty * getIslemUcreti() * 2;
                    else if (["1.7", "1.8"].includes(item.code)) newItem.calc = (qty) => qty * getIslemUcreti() * 4;
                    else if (["1.2.2", "1.4", "1.5", "1.9", "1.10.2"].includes(item.code)) newItem.calc = (qty) => getIslemUcreti() + (Math.max(0, qty - 1) * getIlaveUcret());
                    else if (["1.1.1.2", "1.1.2.2", "1.1.3.2"].includes(item.code)) newItem.calc = (qty) => getIslemUcreti() + (Math.max(0, qty - 1) * getIlaveUcret());
                    else newItem.calc = (qty) => qty * getIslemUcreti();
                }
                // Özel fixler
                if (item.code === "1.3.2") newItem.calc = (qty) => (getIslemUcreti() + (Math.max(0, qty - 1) * getIlaveUcret())) * 2;
                if (item.code === "1.6") newItem.calc = (qty) => qty * getIslemUcreti() * 2;
                if (item.code === "1.10.2") newItem.calc = (qty) => 2215.00 + (Math.max(0, qty - 1) * ILAVE_GOSTERGE);
                return newItem;
            })
        }));
    }, [yoreselKatsayi]); // Sadece katsayı değiştiğinde yeniden hesapla

    // --- EFFECTS ---
    useEffect(() => {
        if (isManualMode) return; // Manuel moddaysa otomatik güncellemeyi engelle

        if (selectedCity && selectedDistrict) {
            const city = cities.find(c => c.name === selectedCity);
            const district = city?.districts.find(d => d.name === selectedDistrict);
            if (district) {
                // Seçilen türe göre katsayıyı güncelle
                const yeniKatsayi = coefficientType === 'tapu' ? district.kv : district.kadastro_kv;
                setYoreselKatsayi(yeniKatsayi || 0);
            }
        }
    }, [selectedCity, selectedDistrict, cities, coefficientType, isManualMode]);

    // --- HANDLERS ---
    const handleCityChange = (e) => {
        setSelectedCity(e.target.value);
        setSelectedDistrict('');
        setYoreselKatsayi(1.0);
    };

    const toggleSection = (id) => setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
    const handleQtyChange = (code, val) => setQuantities(prev => ({ ...prev, [code]: parseFloat(val) || 0 }));

    const formatCurrency = (value) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);

    // --- PDF PARSER ---
    const parseKatsayiText = (text) => {
        const tokens = text.split(/["\n\r]+/).map(t => t.trim()).filter(t => t.length > 0 && t !== ',');
        const results = [];
        let i = 0;
        while (i < tokens.length) {
            const token = tokens[i];
            if (/^\d+$/.test(token)) { // Sıra No
                if (i + 5 < tokens.length) {
                    const row = tokens.slice(i, i + 6);
                    const tapu = parseFloat(row[4].replace(',', '.'));
                    const kadastro = parseFloat(row[5].replace(',', '.'));
                    if (!isNaN(tapu) && !isNaN(kadastro)) {
                        results.push({ il: row[2], ilce: row[3], kv: tapu }); // Tapu katsayısını alıyoruz
                        i += 6;
                        continue;
                    }
                }
            }
            i++;
        }
        return results;
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file || file.type !== 'application/pdf') {
            setPdfError('Lütfen geçerli bir PDF dosyası yükleyin.');
            return;
        }
        setIsProcessing(true);
        setPdfError(null);
        setParsedPdfData([]);
        try {
            const pdfjs = await loadPdfJs();
            const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
            let fullText = "";
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                fullText += (await page.getTextContent()).items.map(it => it.str).join('\n') + '\n';
            }
            const data = parseKatsayiText(fullText);
            if (data.length === 0) throw new Error("Veri bulunamadı. TKGM formatında olduğundan emin olun.");
            setParsedPdfData(data);
        } catch (err) {
            setPdfError('Hata: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const applyPdfDataToApp = () => {
        // Flat datayı App formatına çevir
        const cityMap = {};
        parsedPdfData.forEach(item => {
            if (!cityMap[item.il]) cityMap[item.il] = { id: Math.random(), name: item.il, districts: [] };
            cityMap[item.il].districts.push({ name: item.ilce, kv: item.kv });
        });
        setCities(Object.values(cityMap));
        setIsDataModalOpen(false);
        alert(`${parsedPdfData.length} ilçe katsayısı başarıyla güncellendi!`);
    };

    const calculateTotal = (item, qty) => {
        if (!qty) return 0;
        if (item.type === 'fixed') return item.price * qty;
        if (item.type === 'formula') return item.calc(qty);
        if (item.type === 'kadastro_formula') return Math.max(MIN_KADASTRO_UCRETI, (item.basePrice * yoreselKatsayi) * qty);
        return 0;
    };

    // Arama Filtresi
    const filteredData = useMemo(() => {
        if (!searchTerm) return processedTariffData;
        return processedTariffData.map(sec => ({
            ...sec,
            items: sec.items.filter(i => i.desc.toLowerCase().includes(searchTerm.toLowerCase()) || i.code.includes(searchTerm))
        })).filter(sec => sec.items.length > 0);
    }, [searchTerm, processedTariffData]);

    return (
        <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] font-sans antialiased pb-28">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-4 shadow-sm">
                <div className="max-w-6xl mx-auto flex flex-col items-center gap-4">
                    <div className="w-full flex md:flex-row flex-col items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-lg"><FileText className="text-white" size={24} /></div>
                            <div>
                                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">TKGM 2026</h1>
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter mt-1">Döner Sermaye Tarife Cetveli</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative group flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input type="text" placeholder="Madde ara..." className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <button onClick={() => { setIsDataModalOpen(true); setParsedPdfData([]); setPdfError(null); }} className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors text-xs font-bold uppercase tracking-tight whitespace-nowrap">
                                <Upload size={16} /> PDF Yükle
                            </button>
                        </div>
                    </div>
                    {/* İl/İlçe Seçimi ve Manuel Mod Göstergesi */}
                    <div className={`w-full border p-3 rounded-xl flex flex-col md:flex-row items-center gap-4 transition-colors duration-300 ${isManualMode ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-100'}`}>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <MapPin size={16} className={isManualMode ? "text-amber-500" : "text-blue-500"} />
                            <select
                                className={`border text-sm rounded-lg p-2 outline-none transition-colors w-full md:w-auto ${isManualMode ? 'bg-slate-50 text-slate-400 border-amber-200 cursor-not-allowed' : 'bg-white text-slate-700 border-blue-200'}`}
                                value={selectedCity}
                                onChange={handleCityChange}
                                disabled={isManualMode}
                            >
                                <option value="">İl Seçiniz</option>
                                {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <select
                                className={`border text-sm rounded-lg p-2 outline-none transition-colors w-full md:w-auto ${isManualMode ? 'bg-slate-50 text-slate-400 border-amber-200 cursor-not-allowed' : 'bg-white text-slate-700 border-blue-200 disabled:bg-slate-100'}`}
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                disabled={!selectedCity || isManualMode}
                            >
                                <option value="">İlçe Seçiniz</option>
                                {selectedCity && cities.find(c => c.name === selectedCity)?.districts.map((d, i) => <option key={i} value={d.name}>{d.name}</option>)}
                            </select>
                        </div>

                        {/* Radio Buttons for Coefficient Type */}
                        <div className={`flex items-center gap-4 px-3 py-2 rounded-lg border transition-all ${isManualMode ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed grayscale' : 'bg-white/50 border-blue-100/50'}`}>
                            <label className={`flex items-center gap-2 select-none group ${isManualMode ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${coefficientType === 'tapu' && !isManualMode ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'}`}>
                                    {coefficientType === 'tapu' && !isManualMode && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    {coefficientType === 'tapu' && isManualMode && <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />}
                                </div>
                                <input
                                    type="radio"
                                    className="hidden"
                                    name="katsayiTuru"
                                    value="tapu"
                                    checked={coefficientType === 'tapu'}
                                    onChange={() => !isManualMode && setCoefficientType('tapu')}
                                    disabled={isManualMode}
                                />
                                <span className={`text-sm font-medium transition-colors ${coefficientType === 'tapu' && !isManualMode ? 'text-blue-700' : 'text-slate-500'}`}>Tapu Katsayısı</span>
                            </label>

                            <label className={`flex items-center gap-2 select-none group ${isManualMode ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${coefficientType === 'kadastro' && !isManualMode ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'}`}>
                                    {coefficientType === 'kadastro' && !isManualMode && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    {coefficientType === 'kadastro' && isManualMode && <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />}
                                </div>
                                <input
                                    type="radio"
                                    className="hidden"
                                    name="katsayiTuru"
                                    value="kadastro"
                                    checked={coefficientType === 'kadastro'}
                                    onChange={() => !isManualMode && setCoefficientType('kadastro')}
                                    disabled={isManualMode}
                                />
                                <span className={`text-sm font-medium transition-colors ${coefficientType === 'kadastro' && !isManualMode ? 'text-blue-700' : 'text-slate-500'}`}>Kadastro Katsayısı</span>
                            </label>
                        </div>

                        <div className={`flex items-center gap-3 ml-auto px-4 py-2 rounded-lg border shadow-sm transition-all ${isManualMode ? 'bg-white border-amber-300 shadow-amber-100 ring-4 ring-amber-50' : 'bg-white border-blue-200'}`}>
                            <span className={`text-xs font-bold uppercase tracking-wider ${isManualMode ? 'text-amber-600' : 'text-slate-400'}`}>
                                {isManualMode ? 'Manuel Katsayı:' : 'Yöresel Katsayı:'}
                            </span>
                            {isManualMode ? (
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-20 text-right font-black text-amber-600 font-mono text-xl bg-transparent outline-none border-b border-dashed border-amber-300 focus:border-solid focus:border-amber-500"
                                        value={yoreselKatsayi}
                                        onChange={(e) => setYoreselKatsayi(Math.max(0, parseFloat(e.target.value) || 0))}
                                    />
                                    <div className="flex flex-col gap-0.5">
                                        <button onClick={() => setYoreselKatsayi(k => Number((k + 0.01).toFixed(2)))} className="text-amber-400 hover:text-amber-600 bg-amber-50 rounded px-1"><ChevronUp size={12} /></button>
                                        <button onClick={() => setYoreselKatsayi(k => Math.max(0, Number((k - 0.01).toFixed(2))))} className="text-amber-400 hover:text-amber-600 bg-amber-50 rounded px-1"><ChevronDown size={12} /></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xl font-black text-blue-600 font-mono">
                                    {yoreselKatsayi.toFixed(2)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Liste */}
            <main className="max-w-6xl mx-auto mt-6 px-4 space-y-4">
                {filteredData.map(section => (
                    <div key={section.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <button onClick={() => toggleSection(section.id)} className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4"><span className="text-2xl font-black text-slate-200">{section.id}</span>
                                <div className="text-left"><h2 className="text-sm font-bold text-slate-800 uppercase">{section.title}</h2>{section.note && <p className="text-[10px] text-slate-400 hidden md:block">{section.note}</p>}</div></div>
                            {expandedSections[section.id] ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                        </button>
                        {expandedSections[section.id] && (
                            <div className="overflow-x-auto border-t border-slate-100">
                                <table className="w-full text-left text-sm">
                                    <thead><tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest"><th className="px-6 py-3 w-28">Kod</th><th className="px-6 py-3">Açıklama</th><th className="px-6 py-3 w-40">Miktar</th><th className="px-6 py-3 text-right w-40">Tutar</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {section.items.map(item => {
                                            const qty = quantities[item.code] || 0;
                                            const total = calculateTotal(item, qty);
                                            return (
                                                <tr key={item.code} className={qty > 0 ? 'bg-blue-50/30' : 'hover:bg-slate-50'}>
                                                    <td className="px-6 py-4 font-mono font-bold text-blue-600/70 text-xs pt-5">{item.code}</td>
                                                    <td className="px-6 py-4"><div className={qty > 0 ? 'text-blue-900 font-semibold' : 'text-slate-700 font-semibold'}>{item.desc}</div>{item.info && <div className="text-[10px] text-amber-600 bg-amber-50 inline-flex px-2 rounded mt-1"><AlertTriangle size={10} className="mr-1" />{item.info}</div>}</td>
                                                    <td className="px-6 py-4"><input type="number" placeholder="0" min="0" className={`w-24 px-3 py-2 border rounded-lg text-sm font-bold outline-none ${qty > 0 ? 'border-blue-300 text-blue-700' : 'border-slate-200'}`} onChange={(e) => handleQtyChange(item.code, e.target.value)} /><div className="text-[10px] text-slate-400 mt-1 uppercase">{item.unit}</div></td>
                                                    <td className="px-6 py-4 text-right pt-5"><div className={qty > 0 ? 'text-blue-700 font-bold text-lg' : 'text-slate-300 font-bold text-lg'}>{qty > 0 ? formatCurrency(total) : '-'}</div></td>
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

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 shadow-lg">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase">Toplam Tahakkuk</p><p className="text-xs text-slate-500">KDV Dahil / 2026</p></div>
                    <div className="text-3xl font-black text-slate-900">{formatCurrency(processedTariffData.reduce((acc, sec) => acc + sec.items.reduce((sa, it) => sa + calculateTotal(it, quantities[it.code]), 0), 0))}</div>
                </div>
            </div>

            {/* PDF MODAL */}
            {isDataModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-xl font-bold text-slate-800">Yöresel Katsayı PDF'ini Yükle</h3>
                            <button onClick={() => setIsDataModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <div className="p-8 overflow-y-auto flex-1">
                            {!parsedPdfData.length ? (
                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer relative group">
                                    <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={isProcessing} />
                                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        {isProcessing ? <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /> : <Upload className="text-blue-600 w-8 h-8" />}
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-2">{isProcessing ? 'PDF Çözümleniyor...' : 'PDF Dosyasını Buraya Sürükleyin'}</h4>
                                    <p className="text-sm text-slate-500">TKGM resmi katsayı listesi (.pdf) formatında olmalıdır.</p>
                                    {pdfError && <div className="mt-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm font-medium flex items-center gap-2 justify-center"><AlertCircle size={16} />{pdfError}</div>}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setPreviewMode('json')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${previewMode === 'json' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>JSON</button>
                                            <button onClick={() => setPreviewMode('table')} className={`px-3 py-1.5 text-xs font-bold rounded-lg ${previewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>TABLO</button>
                                        </div>
                                        <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">{parsedPdfData.length} İlçe Bulundu</span>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl border border-slate-200 h-64 overflow-auto">
                                        {previewMode === 'json' ? (
                                            <pre className="p-4 text-xs font-mono text-slate-600">{JSON.stringify(parsedPdfData.slice(0, 10), null, 2)}\n... (ve {parsedPdfData.length - 10} kayıt daha)</pre>
                                        ) : (
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-100 sticky top-0"><tr><th className="p-2">İl</th><th className="p-2">İlçe</th><th className="p-2 text-right">Katsayı</th></tr></thead>
                                                <tbody>
                                                    {parsedPdfData.map((r, i) => (
                                                        <tr key={i} className="border-b border-slate-100"><td className="p-2">{r.il}</td><td className="p-2">{r.ilce}</td><td className="p-2 text-right font-bold text-blue-600">{r.kv}</td></tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {parsedPdfData.length > 0 && (
                            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                                <button onClick={() => setParsedPdfData([])} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl">İptal / Yeni Yükle</button>
                                <button onClick={applyPdfDataToApp} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2"><Save size={18} /> Verileri Uygula</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
