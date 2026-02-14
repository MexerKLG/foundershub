import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Package, ArrowRightLeft, Settings, TrendingUp, AlertTriangle, Plus, Trash2, 
  Edit2, Save, X, MessageSquare, DollarSign, Globe, Link as LinkIcon, FileText, 
  CheckCircle, Clock, Lightbulb, ArrowRight, ArrowLeft, CreditCard, Tag, List, LayoutGrid, 
  Briefcase, Repeat, File, ExternalLink, Ship, Box, PieChart as PieChartIcon, PauseCircle, ShoppingCart, 
  Activity, BarChart2, TrendingDown, ArrowUpRight, ArrowDownRight, Container, Plane
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart, ReferenceLine
} from 'recharts';

// --- CONFIG & CONSTANTS ---
const STORAGE_KEY = "founder_erp_v7_final_perfect_v76"; 
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const STATUS_LABELS: Record<string, string> = {
    IDEA: '1. Idee', DEV: '2. Entwicklung', SOURCING: '3. Sourcing', PRODUCTION: '4. Produktion',
    SHIPPING: '5. Transit (Schiff)', AMAZON_WAREHOUSE: '6. FBA Check-In', ACTIVE_SALES: '7. Verkauf', EOL: '8. EOL'
};

const INITIAL_DATA = {
    accounts: [{ id: 'acc1', name: 'Hauptkonto CHF', type: 'BANK', currency: 'CHF' as const, balance: 25000 }],
    categories: [
        { id: 'cat_in_1', name: 'Umsatz Amazon', type: 'IN', isSystem: true },
        { id: 'cat_out_1', name: 'Wareneinkauf', type: 'OUT', isSystem: true },
        { id: 'cat_out_2', name: 'Fracht & Zoll', type: 'OUT' },
        { id: 'cat_out_3', name: 'Marketing', type: 'OUT' },
        { id: 'cat_out_4', name: 'Software', type: 'OUT' },
        { id: 'cat_out_5', name: 'Lohn / Entnahme', type: 'OUT' },
    ],
    liquidityCategories: [
        { id: 'l_cat_1', name: 'Amazon Payouts', type: 'IN' },
        { id: 'l_cat_2', name: 'Wareneinkäufe', type: 'OUT' },
        { id: 'l_cat_3', name: 'Marketing / Ads', type: 'OUT' },
        { id: 'l_cat_4', name: 'Fixkosten / Tools', type: 'OUT' },
    ],
    products: [
        { 
            id: 'prod1', name: 'Bambus Organizer', sku: 'BAM-001', status: 'ACTIVE_SALES' as const, 
            salesPrice: 29.90, stock: 450, dailyVelocity: 12,
            costs: { exw: 4.5, freight: 1.2, customs: 0.5, packaging: 0.8, other: 0.1 },
            tasks: [], files: [], updates: [], agreements: []
        }
    ],
    supplyChainItems: [],
    entries: [],
    budgets: [], 
    rates: { EUR: 0.94, USD: 0.88 }
};

// --- HILFSFUNKTIONEN ---

const safeLoad = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return INITIAL_DATA;
        const parsed = JSON.parse(saved);
        return {
            ...INITIAL_DATA,
            ...parsed,
            products: (parsed.products || []).map((p: any) => ({
                ...INITIAL_DATA.products[0], ...p,
                agreements: p.agreements || [],
                files: p.files || [], updates: p.updates || [], tasks: p.tasks || [],
                costs: p.costs || { ...INITIAL_DATA.products[0].costs }
            })),
            supplyChainItems: parsed.supplyChainItems || [],
            liquidityCategories: parsed.liquidityCategories || INITIAL_DATA.liquidityCategories
        };
    } catch (e) { return INITIAL_DATA; }
};

const MoneyInput = ({ value, onChange, className, placeholder }: any) => {
    const [val, setVal] = useState(value === 0 ? '' : value.toString());
    useEffect(() => { 
        if (parseFloat(val || '0') !== value) setVal(value === 0 ? '' : value.toString()); 
    }, [value]);

    return (
        <input 
            type="number" className={className} placeholder={placeholder} value={val} 
            onChange={e => setVal(e.target.value)} 
            onBlur={() => {
                const num = parseFloat(val);
                onChange(isNaN(num) ? 0 : num);
            }}
        />
    );
};

const SafeInput = ({ value, onChange, className, placeholder, type = "text" }: any) => {
    const [val, setVal] = useState(value);
    useEffect(() => { setVal(value); }, [value]);
    return (
        <input 
            type={type} className={className} placeholder={placeholder} value={val} 
            onChange={e => setVal(e.target.value)} 
            onBlur={() => {
                 const finalVal = type === 'number' ? parseFloat(val) || 0 : val;
                 if (finalVal !== value) onChange(finalVal);
            }}
        />
    );
};

// --- SUB-COMPONENTS ---

const DashboardView = ({ data, toCHF, fmt, setSelectedProduct }: any) => {
    const liquid = data.accounts.reduce((s:number, a:any) => s + toCHF(a.balance, a.currency), 0);
    const monthlyFix = data.entries.filter((e:any) => e.isFixed).reduce((s:number, e:any) => s + toCHF(e.amount, e.currency), 0);

    const liquidityTrend = useMemo(() => {
        let currentL = liquid;
        return Array.from({length: 30}, (_, i) => {
            const date = new Date(); date.setDate(date.getDate() + i);
            return { name: date.toLocaleDateString('de-DE', {day:'2-digit', month:'2-digit'}), val: currentL };
        });
    }, [liquid]); 

    const getBucket = (keys: string[]) => data.products.filter((p:any) => keys.includes(p.status));

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-end">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Cockpit</h2>
                <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Liquidität Gesamt</div>
                    <div className="text-2xl font-bold text-slate-800">{fmt(liquid, 'CHF')}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border shadow-sm"><div className="flex items-center justify-between mb-2"><span className="text-[10px] font-bold text-slate-400 uppercase">Fixkosten</span><Activity size={14} className="text-red-400"/></div><div className="text-xl font-bold text-slate-800">{fmt(monthlyFix, 'CHF')}</div></div>
                <div className="bg-white p-5 rounded-xl border shadow-sm"><div className="flex items-center justify-between mb-2"><span className="text-[10px] font-bold text-slate-400 uppercase">Lagerwert</span><Box size={14} className="text-blue-400"/></div><div className="text-xl font-bold text-slate-800">{fmt(data.products.reduce((s:number, p:any) => s + (p.stock * (p.costs?.exw || 0) * 0.88), 0), 'CHF')}</div></div>
                <div className="bg-white p-5 rounded-xl border shadow-sm"><div className="flex items-center justify-between mb-2"><span className="text-[10px] font-bold text-slate-400 uppercase">SKUs</span><Package size={14} className="text-emerald-400"/></div><div className="text-xl font-bold text-slate-800">{data.products.length}</div></div>
                <div className="bg-white p-5 rounded-xl border shadow-sm"><div className="flex items-center justify-between mb-2"><span className="text-[10px] font-bold text-slate-400 uppercase">Aktiv</span><TrendingUp size={14} className="text-blue-600"/></div><div className="text-xl font-bold text-slate-800">{data.products.filter((p:any)=>p.status==='ACTIVE_SALES').length}</div></div>
            </div>

            <div className="h-64 bg-white p-5 rounded-xl border shadow-sm">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Liquiditäts-Forecast (30 Tage)</h4>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={liquidityTrend}>
                        <defs><linearGradient id="colorD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                        <XAxis dataKey="name" tick={{fontSize:10}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value: number) => fmt(value, 'CHF')} />
                        <Area type="monotone" dataKey="val" name="Liquidität" stroke="#3b82f6" strokeWidth={2} fill="url(#colorD)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-4 gap-4">
                {['IDEA', 'SOURCING', 'SHIPPING', 'ACTIVE_SALES'].map((key, idx) => {
                    const labels = ['Konzept', 'Produktion', 'Transit', 'Verkauf'];
                    const filterKeys = idx === 0 ? ['IDEA','DEV'] : idx === 1 ? ['SOURCING','PRODUCTION'] : idx === 2 ? ['SHIPPING','AMAZON_WAREHOUSE'] : ['ACTIVE_SALES','EOL'];
                    const color = idx === 0 ? 'bg-amber-50' : idx === 1 ? 'bg-blue-50' : idx === 2 ? 'bg-indigo-50' : 'bg-emerald-50';
                    const list = data.products.filter((p:any) => filterKeys.includes(p.status));
                    return (
                        <div key={key} className={`p-4 rounded-xl border flex flex-col h-64 ${color}`}>
                            <div className="flex justify-between items-center mb-3 font-bold text-slate-700">
                                <span className="text-xs tracking-tight uppercase font-black text-slate-400">{labels[idx]}</span><span className="bg-white px-2 rounded text-xs shadow-sm">{list.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2">
                                {list.map((p:any) => (
                                    <div key={p.id} onClick={() => setSelectedProduct(p)} className="bg-white p-2 rounded border shadow-sm cursor-pointer hover:border-blue-400 text-sm transition-colors">
                                        <div className="font-bold text-slate-800">{p.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const LiquidityView = ({ data, updateData, toCHF }: any) => {
    const [showCats, setShowCats] = useState(false);
    const [newCat, setNewCat] = useState('');
    const [newType, setNewType] = useState('OUT');

    const months = useMemo(() => Array.from({length: 12}, (_, i) => {
        const d = new Date(); d.setMonth(d.getMonth() + i);
        return { label: d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }), id: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, date: d };
    }), []);

    const setBudget = (cid: string, mid: string, field: string, val: number) => {
        const existing = data.budgets.find((b:any) => b.categoryId === cid && b.monthStr === mid);
        const entry = existing ? { ...existing, [field]: val } : { categoryId: cid, monthStr: mid, planned: 0, real: 0, [field]: val };
        updateData('budgets', data.budgets.map((b:any) => b.categoryId === cid && b.monthStr === mid ? entry : b).concat(existing ? [] : [entry]));
    };

    const getFix = (date: Date, mode: 'PLAN' | 'REAL') => {
        const mYear = date.getFullYear();
        const mMonth = date.getMonth();
        return data.entries.filter((e:any) => {
            if (!e.isFixed && e.recurrence === 'NONE') return false; 
            const eDate = new Date(e.date);
            const match = (e.recurrence === 'MONTHLY' ? (eDate.getFullYear() < mYear || (eDate.getFullYear() === mYear && eDate.getMonth() <= mMonth)) : (eDate.getMonth() === mMonth && eDate.getFullYear() === mYear));
            if (!match) return false;
            if (mode === 'REAL') return e.status === 'PAID';
            return true; 
        }).reduce((s:number, e:any) => s + toCHF(e.amount, e.currency), 0);
    };

    const chartData = months.map(m => {
        const bs = data.budgets.filter((b:any) => b.monthStr === m.id);
        const inP = bs.filter((b:any) => data.liquidityCategories.find((c:any) => c.id === b.categoryId)?.type === 'IN').reduce((s:number, b:any) => s + (b.planned || 0), 0);
        const inR = bs.filter((b:any) => data.liquidityCategories.find((c:any) => c.id === b.categoryId)?.type === 'IN').reduce((s:number, b:any) => s + (b.real || 0), 0);
        const outP = bs.filter((b:any) => data.liquidityCategories.find((c:any) => c.id === b.categoryId)?.type === 'OUT').reduce((s:number, b:any) => s + (b.planned || 0), 0);
        const outR = bs.filter((b:any) => data.liquidityCategories.find((c:any) => c.id === b.categoryId)?.type === 'OUT').reduce((s:number, b:any) => s + (b.real || 0), 0);
        const fixP = getFix(m.date, 'PLAN');
        const fixR = getFix(m.date, 'REAL');
        return { name: m.label, PlanNet: inP - (outP + fixP), RealNet: inR - (outR + fixR) };
    });

    let currentL = data.accounts.reduce((s:number, a:any) => s + toCHF(a.balance || 0, a.currency), 0);
    const accumulatedData = chartData.map(d => {
        currentL += d.PlanNet;
        return { ...d, totalLiquid: currentL };
    });

    const renderTable = (type: 'IN' | 'OUT', title: string) => (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden mb-8">
            <div className="p-3 bg-slate-50 border-b font-bold text-slate-700 sticky left-0 uppercase tracking-widest text-[10px]">{title}</div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-slate-50">
                            <th className="p-2 text-left w-48 border-r bg-slate-50 sticky left-0 z-10 shadow-sm font-bold text-xs text-slate-500 uppercase tracking-widest">Kategorie</th>
                            {months.map(m => <th key={m.id} colSpan={2} className="p-2 text-center border-r min-w-[140px] bg-slate-50 text-xs font-bold text-slate-700">{m.label}</th>)}
                        </tr>
                        <tr className="bg-slate-50/50 border-b">
                            <th className="p-2 border-r bg-slate-50 sticky left-0 z-10"></th>
                            {months.map(m => (<React.Fragment key={m.id}><th className="p-1 text-center border-r text-[9px] text-slate-400 font-bold uppercase w-[70px]">Plan</th><th className="p-1 text-center border-r text-[9px] text-slate-400 font-bold uppercase w-[70px]">Real</th></React.Fragment>))}
                        </tr>
                    </thead>
                    <tbody>
                        {type === 'OUT' && (
                            <tr className="bg-orange-50/30">
                                <td className="p-2 border-r font-bold text-orange-800 sticky left-0 bg-orange-50 text-xs">Fixkosten (Auto)</td>
                                {months.map(m => (<React.Fragment key={m.id}><td className="p-2 text-center border-r text-orange-800 font-mono text-xs">{getFix(m.date, 'PLAN').toFixed(0)}</td><td className="p-2 text-center border-r text-orange-800 font-mono text-xs">{getFix(m.date, 'REAL').toFixed(0)}</td></React.Fragment>))}
                            </tr>
                        )}
                        {(data.liquidityCategories || INITIAL_DATA.liquidityCategories).filter((c:any) => c.type === type).map((cat:any) => (
                            <tr key={cat.id} className="hover:bg-slate-50 group">
                                <td className="p-2 border-r font-medium sticky left-0 bg-white shadow-sm text-xs">{cat.name}</td>
                                {months.map(m => {
                                    const b = data.budgets.find((bx:any) => bx.categoryId === cat.id && bx.monthStr === m.id) || {planned:0, real:0};
                                    return (
                                        <React.Fragment key={m.id}>
                                            <td className="p-0 border-r h-8 relative w-[70px]"><MoneyInput className="w-full h-full text-right px-2 text-blue-600 bg-transparent outline-none focus:bg-blue-50 text-xs border-r border-slate-100" value={b.planned} onChange={(v:number) => setBudget(cat.id, m.id, 'planned', v)}/></td>
                                            <td className="p-0 border-r h-8 relative w-[70px]"><MoneyInput className="w-full h-full text-right px-2 text-slate-800 font-bold bg-transparent outline-none focus:bg-blue-50 text-xs" value={b.real} onChange={(v:number) => setBudget(cat.id, m.id, 'real', v)}/></td>
                                        </React.Fragment>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold tracking-tight">Liquiditäts-Planung</h2><button onClick={() => setShowCats(!showCats)} className="text-[10px] font-bold uppercase border px-3 py-1 rounded bg-white text-slate-500 hover:bg-slate-50">Kategorien bearbeiten</button></div>
            {showCats && (<div className="bg-white p-4 rounded border mb-4 animate-in fade-in"><div className="flex gap-2 mb-2"><input className="border p-1 rounded flex-1 text-sm outline-none" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Neue Kategorie" /><select className="border p-1 rounded text-sm" value={newType} onChange={e => setNewType(e.target.value)}><option value="IN">Einnahme</option><option value="OUT">Ausgabe</option></select><button onClick={() => {if(newCat){updateData('liquidityCategories', [...(data.liquidityCategories || INITIAL_DATA.liquidityCategories), {id: Date.now().toString(), name: newCat, type: newType}]); setNewCat('')}}} className="bg-blue-600 text-white px-4 rounded font-bold text-sm">Add</button></div><div className="flex gap-2 flex-wrap">{(data.liquidityCategories || INITIAL_DATA.liquidityCategories).map((c:any) => <div key={c.id} className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold uppercase text-slate-600 flex gap-1 items-center">{c.name} <button onClick={() => updateData('liquidityCategories', (data.liquidityCategories || INITIAL_DATA.liquidityCategories).filter((x:any)=>x.id!==c.id))} className="text-red-500 font-bold ml-1">x</button></div>)}</div></div>)}
            
            <div className="h-80 bg-white p-6 rounded-xl border shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={accumulatedData} margin={{top: 10, right: 10, left: 0, bottom: 0}}>
                        <defs><linearGradient id="colorLiq" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                        <XAxis dataKey="name" tick={{fontSize:10, fill:'#64748b'}} axisLine={false} tickLine={false} dy={10}/>
                        <YAxis yAxisId="left" tick={{fontSize:10, fill:'#64748b'}} axisLine={false} tickLine={false}/>
                        <Tooltip />
                        <Legend wrapperStyle={{fontSize: '11px', paddingTop: '20px'}}/>
                        <Area yAxisId="left" type="monotone" dataKey="totalLiquid" name="Total Liquidität" stroke="#3b82f6" strokeWidth={3} fill="url(#colorLiq)" />
                        <Bar yAxisId="left" dataKey="PlanNet" name="Monatl. Cashflow" fill="#94a3b8" opacity={0.4} barSize={20} radius={[4,4,0,0]} />
                        <ReferenceLine yAxisId="left" y={0} stroke="#cbd5e1" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            {renderTable('IN', 'Planbare Einnahmen')}
            {renderTable('OUT', 'Planbare Ausgaben')}
        </div>
    );
};

const TransactionsView = ({ data, updateData, fmt }: any) => {
    const [newTx, setNewTx] = useState<any>({ title: '', amount: 0, currency: 'CHF', categoryId: data.categories[0]?.id || '', isFixed: false, recurrence: 'NONE', status: 'PLANNED', date: new Date().toISOString().split('T')[0] });
    const [showCats, setShowCats] = useState(false);
    const [newCat, setNewCat] = useState('');

    const addTx = () => { if(!newTx.title) return; updateData('entries', [...data.entries, { ...newTx, id: Date.now().toString() }]); setNewTx({ ...newTx, title: '', amount: 0, date: new Date().toISOString().split('T')[0] }); };
    
    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold tracking-tight">Finanzen & Buchungen</h2><button onClick={() => setShowCats(!showCats)} className="text-[10px] font-bold uppercase border px-3 py-1 rounded bg-white text-slate-500 hover:bg-slate-50">Kategorien bearbeiten</button></div>
            {showCats && (<div className="bg-white p-4 rounded border mb-4 animate-in fade-in"><div className="flex gap-2 mb-2"><input className="border p-2 rounded flex-1 text-sm outline-none" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Neue Kategorie" /><button onClick={() => {if(newCat){updateData('categories', [...data.categories, {id: Date.now().toString(), name: newCat, type: 'OUT'}]); setNewCat('')}}} className="bg-blue-600 text-white px-4 rounded font-bold text-sm">Add</button></div><div className="flex gap-2 flex-wrap">{data.categories.map((c:any) => <div key={c.id} className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold uppercase text-slate-600 flex gap-1 items-center">{c.name} {!c.isSystem && <button onClick={() => updateData('categories', data.categories.filter((x:any)=>x.id!==c.id))} className="text-red-500 font-bold ml-1">x</button>}</div>)}</div></div>)}
            
            <div className="bg-white p-6 rounded-xl border shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2"><label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">Beschreibung</label><input className="w-full border p-2 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" value={newTx.title} onChange={e => setNewTx({...newTx, title: e.target.value})} placeholder="Rechnung..." /></div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">Betrag</label>
                    <div className="flex">
                        <MoneyInput className="w-full border p-2 rounded-l text-sm outline-none focus:ring-1 focus:ring-blue-400" value={newTx.amount} onChange={(v:number) => setNewTx({...newTx, amount: v})} />
                        <select className="border-y border-r p-2 rounded-r text-sm bg-slate-50 outline-none" value={newTx.currency} onChange={e => setNewTx({...newTx, currency: e.target.value as any})}><option>CHF</option><option>EUR</option><option>USD</option></select>
                    </div>
                </div>
                <div><label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">Fälligkeit</label><input type="date" className="w-full border p-2 rounded text-sm outline-none" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} /></div>
                <div className="md:col-span-2"><label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">Kategorie</label><select className="w-full border p-2 rounded text-sm bg-slate-50 outline-none" value={newTx.categoryId} onChange={e => setNewTx({...newTx, categoryId: e.target.value})}>{data.categories.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div className="flex gap-4 items-center h-10">
                    <select className="border p-2 rounded text-xs bg-slate-50 outline-none" value={newTx.recurrence} onChange={e => setNewTx({...newTx, recurrence: e.target.value as Recurrence})}><option value="NONE">Einmalig</option><option value="WEEKLY">Wöchentlich</option><option value="MONTHLY">Monatlich</option><option value="QUARTERLY">Quartalsweise</option><option value="YEARLY">Jährlich</option></select>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600"><input type="checkbox" checked={newTx.isFixed} onChange={e => setNewTx({...newTx, isFixed: e.target.checked})} className="rounded"/> Fixkosten</label>
                </div>
                <button onClick={addTx} className="bg-slate-800 text-white px-10 py-2 rounded font-bold hover:bg-slate-900 active:scale-95 transition-all shadow-md">Buchen</button>
            </div>
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden animate-in slide-in-from-bottom-2">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-widest"><tr><th className="p-4 text-left">Datum</th><th className="p-4 text-left">Titel</th><th className="p-4 text-right">Betrag</th><th className="p-4 text-center">Status</th></tr></thead>
                    <tbody className="divide-y">
                        {data.entries.sort((a:any,b:any)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map((e:any) => (
                            <tr key={e.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-4 font-mono text-slate-400 text-xs">{e.date}</td>
                                <td className="p-4"><div className="font-bold text-slate-800">{e.title}</div><div className="text-[10px] text-slate-400 uppercase tracking-tighter">{data.categories.find((c:any)=>c.id===e.categoryId)?.name}</div></td>
                                <td className={`p-4 text-right font-bold ${e.amount < 0 ? 'text-slate-800' : 'text-emerald-600'}`}>{fmt(e.amount, e.currency)}</td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center gap-1">
                                        <button onClick={() => updateData('entries', data.entries.map((x:any)=>x.id===e.id ? {...x, status: 'PLANNED'} : x))} className={`px-2 py-1 rounded text-[9px] font-bold border transition-colors ${e.status==='PLANNED' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>OFFEN</button>
                                        <button onClick={() => updateData('entries', data.entries.map((x:any)=>x.id===e.id ? {...x, status: 'PAID'} : x))} className={`px-2 py-1 rounded text-[9px] font-bold border transition-colors ${e.status==='PAID' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>BEZAHLT</button>
                                        <button onClick={() => updateData('entries', data.entries.map((x:any)=>x.id===e.id ? {...x, status: 'DEFERRED'} : x))} className={`px-2 py-1 rounded text-[9px] font-bold border transition-colors ${e.status==='DEFERRED' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>AUFSCHIEBEN</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const SupplyChainView = ({ data, updateData }: any) => {
    const items = data.supplyChainItems || [];
    const updateItem = (id: string, field: string, val: any) => updateData('supplyChainItems', items.map((i:any) => i.id === id ? { ...i, [field]: val } : i));
    const addItem = () => updateData('supplyChainItems', [...items, { id: Date.now().toString(), name: 'Neues Produkt', asin: '', fbaStock: 0, warehouseStock: 0, inboundStock: 0, productionStock: 0, dailySales: 0, leadTime: 30, moq: 100, targetDays: 90 }]);

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold tracking-tight">Supply Chain Manager</h2><button onClick={addItem} className="bg-slate-800 text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2 hover:bg-slate-900 shadow-md active:scale-95 transition-all"><Plus size={16}/> SKU hinzufügen</button></div>
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b">
                            <tr><th className="p-4 text-left w-48">Produkt / ASIN</th><th className="p-4 text-right bg-blue-50/20">FBA Stock</th><th className="p-4 text-right bg-blue-50/20">Warehouse</th><th className="p-4 text-right bg-indigo-50/20">Inbound</th><th className="p-4 text-right bg-amber-50/20">Produktion</th><th className="p-4 text-right border-l">Ø Sales/Tag</th><th className="p-4 text-center">Reichweite</th><th className="p-4 text-right bg-slate-50">Ziel (Tage)</th><th className="p-4 text-right bg-emerald-50/30 font-bold border-l">Order Qty</th><th className="p-4 w-10"></th></tr>
                        </thead>
                        <tbody className="divide-y">
                            {items.map((i:any) => {
                                const totalS = (i.fbaStock || 0) + (i.warehouseStock || 0) + (i.inboundStock || 0);
                                const daysC = i.dailySales > 0 ? Math.round(totalS / i.dailySales) : 0;
                                const reorder = Math.max(0, (i.dailySales * i.targetDays) - (totalS + (i.productionStock || 0)));
                                return (
                                    <tr key={i.id} className="hover:bg-slate-50 group transition-colors">
                                        <td className="p-3 pl-4">
                                            <input className="font-bold text-slate-800 bg-transparent w-full outline-none" value={i.name} onChange={e => updateItem(i.id, 'name', e.target.value)} />
                                            <input className="text-[10px] text-slate-400 font-mono bg-transparent w-full outline-none uppercase" value={i.asin} onChange={e => updateItem(i.id, 'asin', e.target.value)} placeholder="ASIN/SKU" />
                                        </td>
                                        <td className="p-2"><MoneyInput className="w-full text-right bg-transparent border-b border-transparent group-hover:border-slate-300 focus:border-blue-500 outline-none font-mono text-xs" value={i.fbaStock} onChange={(v:number) => updateItem(i.id, 'fbaStock', v)}/></td>
                                        <td className="p-2"><MoneyInput className="w-full text-right bg-transparent border-b border-transparent group-hover:border-slate-300 focus:border-blue-500 outline-none font-mono text-xs" value={i.warehouseStock} onChange={(v:number) => updateItem(i.id, 'warehouseStock', v)}/></td>
                                        <td className="p-2 bg-indigo-50/10"><MoneyInput className="w-full text-right bg-transparent border-b border-transparent focus:border-indigo-500 outline-none font-mono text-xs text-indigo-700" value={i.inboundStock} onChange={(v:number) => updateItem(i.id, 'inboundStock', v)}/></td>
                                        <td className="p-2 bg-amber-50/10"><MoneyInput className="w-full text-right bg-transparent border-b border-transparent focus:border-amber-500 outline-none font-mono text-xs text-amber-700" value={i.productionStock} onChange={(v:number) => updateItem(i.id, 'productionStock', v)}/></td>
                                        <td className="p-2 border-l"><MoneyInput className="w-full text-right bg-transparent border-b border-transparent group-hover:border-slate-300 focus:border-slate-500 outline-none font-bold text-xs" value={i.dailySales} onChange={(v:number) => updateItem(i.id, 'dailySales', v)}/></td>
                                        <td className="p-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${daysC < 30 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{daysC} Tage</span></td>
                                        <td className="p-2 bg-slate-50/50"><MoneyInput className="w-full text-right bg-transparent border-b border-transparent group-hover:border-slate-500 focus:border-slate-500 outline-none text-slate-500 text-xs" value={i.targetDays} onChange={(v:number) => updateItem(i.id, 'targetDays', v)}/></td>
                                        <td className="p-2 text-right border-l font-bold text-emerald-600 bg-emerald-50/10 font-mono text-xs font-mono">{reorder > 0 ? Math.max(reorder, i.moq || 0) : '-'}</td>
                                        <td className="p-2 text-center"><button onClick={() => { if(confirm('Löschen?')) updateData('supplyChainItems', items.filter((x:any)=>x.id!==i.id)) }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const SettingsView = ({ data, updateData }: any) => {
    const [newAcc, setNewAcc] = useState({name:'', currency:'CHF'});
    return (
        <div className="max-w-3xl space-y-8 animate-in fade-in">
            <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <h3 className="font-bold text-lg mb-6 border-b pb-2 tracking-tight">Kontenverwaltung</h3>
                <div className="space-y-3">
                    {data.accounts.map((a:any) => (
                        <div key={a.id} className="flex gap-3 mb-2 items-center p-3 bg-slate-50 rounded-xl border border-slate-100 group transition-all hover:bg-white hover:shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600 uppercase tracking-tighter">{a.currency}</div>
                            <SafeInput className="flex-1 bg-transparent py-1 outline-none text-sm font-black text-slate-700" value={a.name} onChange={(v:string) => updateData('accounts', data.accounts.map((x:any) => x.id === a.id ? {...x, name: v} : x))} />
                            <MoneyInput className="w-32 bg-transparent py-1 outline-none text-right font-black text-slate-900" value={a.balance} onChange={(v:number) => updateData('accounts', data.accounts.map((x:any) => x.id === a.id ? {...x, balance: v} : x))} />
                            <button onClick={() => updateData('accounts', data.accounts.filter((x:any) => x.id !== a.id))} className="text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-2"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-3 pt-6 border-t mt-6"><input className="border p-3 rounded-xl flex-1 text-sm outline-none focus:ring-1 focus:ring-blue-400" placeholder="Konto Name..." value={newAcc.name} onChange={e => setNewAcc({...newAcc, name: e.target.value})} /><select className="border p-3 rounded-xl text-sm bg-slate-50 outline-none" value={newAcc.currency} onChange={e => setNewAcc({...newAcc, currency: e.target.value as any})}><option>CHF</option><option>EUR</option><option>USD</option></select><button onClick={() => { if(newAcc.name) updateData('accounts', [...data.accounts, {id: Date.now().toString(), ...newAcc, balance:0}]); setNewAcc({name:'', currency:'CHF'}); }} className="bg-slate-800 text-white px-6 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all">Add</button></div>
            </div>
            <div className="bg-white p-6 rounded-2xl border shadow-sm"><h3 className="font-bold text-lg mb-6 border-b pb-2 tracking-tight">Globale Währungs-Raten (Referenz: CHF)</h3><div className="grid grid-cols-2 gap-6"><div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">1 EUR in CHF</label><MoneyInput className="w-full border p-3 rounded-xl text-sm outline-none font-bold text-slate-700" value={data.rates.EUR} onChange={(v:number) => updateData('rates', {...data.rates, EUR: v})} /></div><div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">1 USD in CHF</label><MoneyInput className="w-full border p-3 rounded-xl text-sm outline-none font-bold text-slate-700" value={data.rates.USD} onChange={(v:number) => updateData('rates', {...data.rates, USD: v})} /></div></div></div>
        </div>
    );
};

const ProductModal = ({product, onClose, onSave}: any) => {
    const [prod, setProd] = useState<any>(product);
    const [tab, setTab] = useState('OVERVIEW');
    const [agreementTags, setAgreementTags] = useState<Record<string, string>>({});
    const [newComment, setNewComment] = useState('');
    const [newFile, setNewFile] = useState({name: '', url: ''});

    const save = () => onSave(prod);
    const updateCosts = (field: string, val: number) => setProd({ ...prod, costs: { ...prod.costs, [field]: val } });
    const addTag = (id: string) => { const tag = agreementTags[id]; if(!tag) return; setProd({ ...prod, agreements: prod.agreements.map((a:any) => a.id === id ? { ...a, tags: [...a.tags, tag] } : a)}); setAgreementTags({...agreementTags, [id]: ''}); };
    const addUpdate = () => { if(!newComment) return; setProd({...prod, updates: [{id:Date.now().toString(), date:new Date().toISOString(), author:'Me', type:'COMMENT', text:newComment}, ...prod.updates]}); setNewComment(''); };
    const addFile = () => { if(!newFile.url) return; setProd({...prod, files: [...prod.files, {id: Date.now().toString(), name: newFile.name || 'Dokument', url: newFile.url}]}); setNewFile({name:'', url:''}); };

    const marginPercent = (((prod.salesPrice || 0) * 0.94 - (prod.costs.exw + prod.costs.freight + prod.costs.customs + prod.costs.packaging + prod.costs.other) * 0.88) / ((prod.salesPrice || 1) * 0.94)) * 100;
    const pieData = [{name: 'Product', value: prod.costs.exw}, {name: 'Freight', value: prod.costs.freight}, {name: 'Duty', value: prod.costs.customs}, {name: 'Other', value: prod.costs.other + prod.costs.packaging}].filter(d=>d.value>0);

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="w-full max-w-5xl bg-white h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-white p-6 border-b flex justify-between items-center">
                    <div><div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Produkt-Editor</div><SafeInput className="text-2xl font-bold outline-none border-b border-transparent focus:border-blue-500 bg-transparent" value={prod.name} onChange={(v:string) => setProd({...prod, name: v})} /></div>
                    <div className="flex gap-2"><button onClick={onClose} className="px-4 py-2 text-slate-500 transition-colors">Schließen</button><button onClick={save} className="px-8 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">Speichern</button></div>
                </div>
                <div className="flex border-b px-6 bg-white overflow-x-auto scrollbar-hide">{['OVERVIEW', 'SOURCING', 'FINANCE', 'FILES', 'TEAM'].map(t => (<button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{t}</button>))}</div>
                <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
                    {tab === 'FINANCE' && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-xl border shadow-sm items-center">
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase block mb-2 tracking-widest">Preis (EUR)</label><MoneyInput className="text-4xl font-black border-b border-transparent focus:border-blue-500 outline-none w-full bg-transparent" value={prod.salesPrice} onChange={(v:number) => setProd({...prod, salesPrice: v})} /></div>
                                <div className="text-right"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-slate-300">Brutto Marge</div><div className={`text-4xl font-black ${marginPercent > 25 ? 'text-emerald-500':'text-amber-500'}`}>{marginPercent.toFixed(1)}%</div></div>
                            </div>
                            <div className="bg-white p-6 rounded-xl border shadow-sm grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Landed Cost (USD)</h4>
                                    {['exw', 'freight', 'customs', 'packaging', 'other'].map(k => (
                                        <div key={k} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{k}</span>
                                            <MoneyInput className="text-right w-24 bg-transparent outline-none font-black text-slate-800" value={(prod.costs as any)[k] || 0} onChange={(v:number) => updateCosts(k, v)} />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col items-center justify-center"><div className="w-full h-48"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">{pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Kostenverteilung</div></div>
                            </div>
                        </div>
                    )}
                    {tab === 'SOURCING' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 bg-white p-6 rounded-xl border shadow-sm">
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Hersteller</label><SafeInput className="w-full border p-2 rounded text-sm outline-none focus:ring-1 focus:ring-blue-400" value={prod.manufacturerName || ''} onChange={(v:string) => setProd({...prod, manufacturerName: v})} placeholder="Name" /></div>
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Link</label><SafeInput className="w-full border p-2 rounded text-sm outline-none" value={prod.manufacturerLink || ''} onChange={(v:string) => setProd({...prod, manufacturerLink: v})} placeholder="https://..." /></div>
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">MOQ</label><SafeInput className="w-full border p-2 rounded text-sm outline-none" value={prod.moq || ''} onChange={(v:any) => setProd({...prod, moq: v})} /></div>
                                <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Lead Time</label><SafeInput className="w-full border p-2 rounded text-sm outline-none" type="number" value={prod.leadTime || 30} onChange={(v:any) => setProd({...prod, leadTime: v})} /></div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">Abmachungen & Tags</label>
                                {prod.agreements.map((a:any) => (
                                    <div key={a.id} className="p-4 border rounded-xl bg-white shadow-sm transition-all hover:border-blue-200 group">
                                        <div className="flex justify-between items-start mb-3"><div className="font-bold text-slate-800 text-sm leading-relaxed">{a.text}</div><button onClick={() => setProd({...prod, agreements: prod.agreements.filter((x:any) => x.id !== a.id)})} className="text-slate-200 group-hover:text-red-400 transition-colors"><Trash2 size={14}/></button></div>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            {a.tags.map((t:any) => <span key={t} className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-bold border border-blue-100 uppercase">{t} <button onClick={() => setProd({...prod, agreements: prod.agreements.map(ag => ag.id === a.id ? {...ag, tags: ag.tags.filter(xt => xt !== t)} : ag)})} className="hover:text-red-500">×</button></span>)}
                                            <div className="flex items-center bg-slate-50 rounded-full px-3 border border-dashed border-slate-300">
                                                <Plus size={10} className="text-slate-400 mr-1"/><input className="text-[10px] outline-none bg-transparent w-20 py-1 font-bold" placeholder="Tag..." value={agreementTags[a.id] || ''} onChange={e => setAgreementTags({...agreementTags, [a.id]: e.target.value})} onKeyDown={e => e.key === 'Enter' && addTag(a.id)}/>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex gap-2">
                                    <textarea className="border p-2 rounded flex-1 text-sm h-12 outline-none focus:ring-1 focus:ring-blue-400" placeholder="Neue Abmachung eintragen..." id="n_agr_box_final"></textarea>
                                    <button onClick={() => { const el = document.getElementById('n_agr_box_final') as HTMLTextAreaElement; if(el.value){ setProd({...prod, agreements: [...prod.agreements, {id: Date.now().toString(), text: el.value, tags:[]}]}); el.value = ''; } }} className="bg-slate-800 text-white px-4 rounded font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 active:scale-95 transition-all">Add</button>
                                </div>
                            </div>
                        </div>
                    )}
                    {tab === 'OVERVIEW' && (<div className="space-y-6 max-w-2xl mx-auto"><div className="bg-white p-6 rounded-xl border shadow-sm"><label className="text-[10px] font-bold text-slate-400 uppercase mb-4 block text-center">Status</label><div className="flex gap-1">{Object.keys(STATUS_LABELS).map(s => (<div key={s} onClick={() => setProd({...prod, status: s})} className={`h-2 flex-1 rounded cursor-pointer transition-all ${Object.keys(STATUS_LABELS).indexOf(s) <= Object.keys(STATUS_LABELS).indexOf(prod.status) ? 'bg-blue-600' : 'bg-slate-200 hover:bg-slate-300'}`} title={s}/>))}</div><div className="text-center font-bold text-blue-600 uppercase text-[10px] mt-2">{STATUS_LABELS[prod.status]}</div></div></div>)}
                    {tab === 'FILES' && (<div className="space-y-4">{prod.files.map((f:any) => (<div key={f.id} className="flex justify-between items-center p-3 bg-white rounded-xl border shadow-sm group hover:border-blue-300 transition-all"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><File size={18}/></div><div><div className="font-bold text-sm text-slate-800">{f.name}</div><a href={f.url} target="_blank" className="text-xs text-blue-500 hover:underline">{f.url}</a></div></div><button onClick={() => setProd({...prod, files: prod.files.filter((x:any) => x.id !== f.id)})} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1"><X size={16}/></button></div>))}<div className="flex gap-2 bg-slate-200/50 p-3 rounded-xl mt-6"><input className="border p-2 rounded flex-1 text-sm outline-none" placeholder="Datei Name" value={newFile.name} onChange={e => setNewFile({...newFile, name: e.target.value})} /><input className="border p-2 rounded flex-[2] text-sm outline-none" placeholder="URL" value={newFile.url} onChange={e => setNewFile({...newFile, url: e.target.value})} /><button onClick={addFile} className="bg-slate-800 text-white px-6 rounded font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all">Add</button></div></div>)}
                    {tab === 'TEAM' && (<div className="flex flex-col h-full space-y-4 min-h-[400px]"><div className="flex-1 space-y-4 overflow-y-auto pr-2">{prod.updates.map((u:any) => (<div key={u.id} className="bg-white p-4 rounded-xl border shadow-sm hover:bg-slate-50 transition-colors"><div className="flex justify-between items-center mb-1"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{u.author}</span><span className="text-[10px] text-slate-300">{new Date(u.date).toLocaleString()}</span></div><p className="text-sm text-slate-800 leading-relaxed font-medium">{u.text}</p></div>))}</div><div className="flex gap-2 pt-4 border-t"><input className="border p-3 rounded-xl flex-1 text-sm focus:ring-1 focus:ring-blue-400 outline-none shadow-inner" placeholder="Nachricht an das Team..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addUpdate()} /><button onClick={addUpdate} className="bg-blue-600 text-white px-8 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95">Senden</button></div></div>)}
                </div>
            </div>
        </div>
    );
};

// --- MAIN WRAPPER ---

export default function App() {
    const [data, setData] = useState<any>(() => safeLoad());
    useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);

    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    const updateData = (key: string, val: any) => setData((prev:any) => ({ ...prev, [key]: val }));
    const getRate = (c: string) => c === 'CHF' ? 1 : ((data.rates as any)[c] || 1);
    const toCHF = (v: number, c: string) => v * getRate(c);
    const fmt = (v: number, c: string) => new Intl.NumberFormat('de-CH', { style: 'currency', currency: c }).format(v);

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
            <div className="w-64 bg-slate-900 text-white flex flex-col p-6 shadow-2xl relative z-10">
                <div className="mb-12"><div className="text-[10px] font-black text-blue-500 uppercase tracking-[.3em] mb-1">Founders Hub</div><div className="text-2xl font-bold tracking-tighter text-white uppercase">ERP v7.0</div></div>
                <nav className="space-y-2 flex-1 scrollbar-hide overflow-y-auto">
                    {[{id: 'dashboard', icon: <LayoutDashboard size={18}/>, label: 'Cockpit'}, {id: 'products', icon: <Package size={18}/>, label: 'Pipeline'}, {id: 'restock', icon: <ShoppingCart size={18}/>, label: 'Supply Chain'}, {id: 'transactions', icon: <ArrowRightLeft size={18}/>, label: 'Finanzen'}, {id: 'liquidity', icon: <TrendingUp size={18}/>, label: 'Liquidität'}, {id: 'settings', icon: <Settings size={18}/>, label: 'Einstellungen'}].map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/50 translate-x-1' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                            {item.icon} {item.label}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div className="flex-1 p-10 overflow-auto bg-[#fafbfc]">
                {activeTab === 'dashboard' && <DashboardView data={data} toCHF={toCHF} fmt={fmt} setSelectedProduct={setSelectedProduct} />}
                {activeTab === 'liquidity' && <LiquidityView data={data} updateData={updateData} toCHF={toCHF} />}
                {activeTab === 'transactions' && <TransactionsView data={data} updateData={updateData} fmt={fmt} />}
                {activeTab === 'products' && (
                    <div className="h-full flex flex-col space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center"><h2 className="text-2xl font-bold tracking-tight">Produkt Pipeline</h2><button onClick={() => { const newP = { id: Date.now().toString(), name: 'Neues Produkt', sku: 'NEW', status: 'IDEA', salesPrice: 0, stock: 0, dailyVelocity: 0, costs: {exw:0,freight:0,customs:0,packaging:0,other:0}, tasks: [], updates: [], files: [], agreements: [] }; updateData('products', [...data.products, newP]); setSelectedProduct(newP); }} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all text-sm tracking-widest">+ Produkt</button></div>
                        <div className="flex-1 overflow-x-auto pb-4 scrollbar-hide"><div className="flex gap-6 h-full min-w-max">{Object.keys(STATUS_LABELS).map(status => (<div key={status} className="w-80 bg-slate-100/50 rounded-2xl flex flex-col border border-slate-200/60 max-h-full"><div className="p-4 font-black text-[10px] uppercase tracking-[.2em] text-slate-400 border-b bg-white/50 rounded-t-2xl sticky top-0 z-10">{STATUS_LABELS[status]}</div><div className="p-3 space-y-3 overflow-y-auto flex-1 scrollbar-hide">{data.products.filter((p:any) => p.status === status).map((p:any) => (<div key={p.id} onClick={() => setSelectedProduct(p)} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"><div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{p.name}</div><div className="text-[10px] text-slate-400 mt-2 font-mono uppercase tracking-tighter">{p.sku}</div></div>))}</div></div>))}</div></div>
                    </div>
                )}
                {activeTab === 'restock' && <SupplyChainView data={data} updateData={updateData} />}
                {activeTab === 'settings' && <SettingsView data={data} updateData={updateData} />}
            </div>
            
            {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onSave={(p:any) => { updateData('products', data.products.map((x:any) => x.id === p.id ? p : x)); setSelectedProduct(null); }} />}
            <style>{`input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; } .scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
        </div>
    );
}