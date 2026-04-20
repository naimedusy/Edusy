$filePath = "f:\Edusy User flow\Edusy app\src\app\dashboard\accounts\page.tsx"

$startMarker = "        // MODAL_START_MARKER"

# I need to find the specific range. 
# Since I know the lines approximately (565 to 1108).
# It's safer to use the marker I just added.

$newCode = @'
function AddCategoryModal({ onClose, initialData, onSave }: { onClose: () => void, initialData?: any, onSave: (data: any) => void }) {
    const { data: session } = useSession();
    const activeInstitute = (session as any)?.activeInstitute;
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        type: (initialData?.type?.toLowerCase() as 'income' | 'expense') || 'income',
        frequencyType: initialData?.config?.frequencyType || (initialData as any)?.frequencyType || 'fixed',
        interval: initialData?.config?.interval || (initialData as any)?.interval || 'monthly',
        provider: initialData?.config?.provider || (initialData as any)?.provider || 'students',
        studentAmountType: initialData?.config?.studentAmountType || (initialData as any)?.provider === 'students' ? (initialData?.config?.studentAmountType || 'flat') : 'flat',
        customGroupAllowed: initialData?.config?.customGroupAllowed || false,
        customGroupName: initialData?.config?.customGroupName || '',
        customGroupScope: initialData?.config?.customGroupScope || 'institute',
        startDate: initialData?.config?.startDate || '',
        endDate: initialData?.config?.endDate || '',
        dueDays: initialData?.config?.dueDays || 5,
        alertDays: initialData?.config?.alertDays || 2,
        alertType: initialData?.config?.alertType || 'before',
        amount: (initialData?.amount === 'variable' || typeof initialData?.amount === 'string') ? 0 : (initialData?.amount || 0),
        studentClassAmounts: initialData?.config?.studentClassAmounts || {},
        studentGroupAmounts: initialData?.config?.studentGroupAmounts || {},
        teacherAmounts: initialData?.config?.teacherAmounts || {},
        customRecipients: initialData?.config?.customRecipients || [{ id: Date.now().toString(), name: '', amount: 0 }],
        cycleCount: initialData?.config?.cycleCount || 1
    });

    const [availableClasses, setAvailableClasses] = useState<any[]>([]);
    const [classGroups, setClassGroups] = useState<{[key: string]: any[]}>({});
    const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    const { totalRecipients, totalDue } = useMemo(() => {
        let recipients = 0;
        let due = 0;

        if (formData.provider === 'students') {
            recipients = availableClasses.reduce((sum, cls) => sum + (cls._count?.students || 0), 0);
            if (formData.studentAmountType === 'flat') {
                due = (recipients * (typeof formData.amount === 'number' ? formData.amount : 0));
            } else if (formData.studentAmountType === 'per-class') {
                due = availableClasses.reduce((sum, cls) => sum + ((cls._count?.students || 0) * (formData.studentClassAmounts?.[cls.id] || 0)), 0);
            } else if (formData.studentAmountType === 'per-group') {
                due = availableClasses.reduce((sum, cls) => {
                    const clsGroups = classGroups[cls.id] || [];
                    const totalGroupStudents = clsGroups.reduce((gSum, grp) => gSum + (grp._count?.students || 0), 0);
                    const classBaseStudents = Math.max(0, (cls._count?.students || 0) - totalGroupStudents);
                    const classBase = classBaseStudents * (formData.studentClassAmounts?.[cls.id] || 0);
                    const groupsSum = clsGroups.reduce((gSum, grp) => gSum + ((grp._count?.students || 0) * (formData.studentGroupAmounts?.[`${cls.id}-${grp.id}`] || 0)), 0);
                    return sum + classBase + groupsSum;
                }, 0);
            }
        } else if (formData.provider === 'teachers') {
            recipients = availableTeachers.length;
            const baseAmount = typeof formData.amount === 'number' ? formData.amount : 0;
            due = (availableTeachers.reduce((sum: number, t: any) => sum + (formData.teacherAmounts?.[t.id] || baseAmount), 0));
        } else if (formData.provider === 'custom') {
            recipients = formData.customRecipients.length;
            due = (formData.customRecipients.reduce((sum: number, r: any) => sum + (r.amount || 0), 0));
        }

        return { totalRecipients: recipients, totalDue: due };
    }, [formData, availableClasses, classGroups, availableTeachers]);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!activeInstitute?.id) return;
            setLoadingData(true);
            try {
                const res = await fetch(`/api/admin/classes?instituteId=${activeInstitute.id}`);
                const data = await res.json();
                const clsList = Array.isArray(data) ? data : [];
                setAvailableClasses(clsList);

                const groupsMap: {[key: string]: any[]} = {};
                clsList.forEach((cls: any) => {
                    groupsMap[cls.id] = Array.isArray(cls.groups) ? cls.groups : [];
                });
                setClassGroups(groupsMap);

                const tRes = await fetch(`/api/teacher?instituteId=${activeInstitute.id}`);
                const tData = await tRes.json();
                setAvailableTeachers(Array.isArray(tData) ? tData : []);

            } catch (error) {
                console.error('Fetch data error:', error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchAllData();
    }, [activeInstitute?.id]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            
            <div className="relative bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col font-bengali">
                {/* Modal Header */}
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-8">
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter whitespace-nowrap">নতুন খাত যোগ করুন</h2>
                        <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-2xl">
                            {[
                                { id: 1, label: 'প্রাথমিক' },
                                { id: 2, label: 'সময়সূচী' },
                                { id: 3, label: 'প্রাপক ও পরিমাণ' }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setStep(t.id)}
                                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        step === t.id ? 'bg-white text-[#045c84] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                        <Plus className="rotate-45" size={24} />
                    </button>
                </div>

                {/* Modal Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar text-slate-800">
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4">খাতের নাম</label>
                                <input 
                                    type="text" 
                                    placeholder="যেমন: মাসিক বেতন বা বিদ্যুৎ বিল"
                                    className="w-full px-8 py-5 bg-slate-50 border-none rounded-2xl text-lg font-black placeholder:text-slate-300 focus:ring-2 focus:ring-[#045c84]/20 transition-all"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setFormData({...formData, type: 'income'})}
                                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                                        formData.type === 'income' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${formData.type === 'income' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                                        <TrendingUp size={24} />
                                    </div>
                                    <span className={`text-sm font-black uppercase tracking-widest ${formData.type === 'income' ? 'text-emerald-700' : 'text-slate-500'}`}>আয়</span>
                                </button>
                                <button 
                                    onClick={() => setFormData({...formData, type: 'expense'})}
                                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                                        formData.type === 'expense' ? 'border-rose-500 bg-rose-50' : 'border-slate-100 hover:border-rose-200'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${formData.type === 'expense' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-600'}`}>
                                        <TrendingDown size={24} />
                                    </div>
                                    <span className={`text-sm font-black uppercase tracking-widest ${formData.type === 'expense' ? 'text-rose-700' : 'text-slate-500'}`}>ব্যয়</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                             <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4">ফ্রিকোয়েন্সি ধরণ</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => setFormData({...formData, frequencyType: 'fixed'})}
                                        className={`p-6 rounded-3xl border-2 transition-all text-left space-y-2 ${
                                            formData.frequencyType === 'fixed' ? 'border-[#045c84] bg-blue-50' : 'border-slate-100'
                                        }`}
                                    >
                                        <p className="font-black text-slate-800">নির্দিষ্ট সময়সাপেক্ষ</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase leading-tight">প্রতিদিন, মাস বা বছর হিসেবে নিয়মিত লেনদেন</p>
                                    </button>
                                    <button 
                                        onClick={() => setFormData({...formData, frequencyType: 'unpredictable'})}
                                        className={`p-6 rounded-3xl border-2 transition-all text-left space-y-2 ${
                                            formData.frequencyType === 'unpredictable' ? 'border-[#045c84] bg-blue-50' : 'border-slate-100'
                                        }`}
                                    >
                                        <p className="font-black text-slate-800">অনির্ধারিত সময়</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase leading-tight">যেকোনো সময় যেকোনো পরিমাণে লেনদেন</p>
                                    </button>
                                </div>
                            </div>

                            {formData.frequencyType === 'fixed' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#045c84] px-4">সময়কাল নির্বাচন করুন</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: 'weekly', label: 'সাপ্তাহিক' },
                                                { id: 'monthly', label: 'মাসিক' },
                                                { id: 'semester', label: 'সামাসিক' },
                                                { id: 'yearly', label: 'বার্ষিক' },
                                                { id: 'one_time_year', label: 'বছরে একবার' },
                                                { id: 'one_time_ever', label: 'এককালীন' }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    onClick={() => setFormData({...formData, interval: opt.id})}
                                                    className={`px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                                                        formData.interval === opt.id ? 'border-[#045c84] bg-white text-[#045c84] shadow-sm' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-6 border-t border-slate-100">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">শুরুর তারিখ</label>
                                                <div className="relative group">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                    <input 
                                                        type="date" 
                                                        value={formData.startDate}
                                                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">শেষের তারিখ (ঐচ্ছিক)</label>
                                                <div className="relative group">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                    <input 
                                                        type="date" 
                                                        value={formData.endDate}
                                                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            {formData.type === 'income' && (
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#045c84] px-2">বকেয়া সময়সীমা (দিন)</label>
                                                    <div className="relative group">
                                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                        <input 
                                                            type="number" 
                                                            value={formData.dueDays}
                                                            onChange={(e) => setFormData({...formData, dueDays: parseInt(e.target.value) || 0})}
                                                            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#045c84] px-2">{formData.type === 'income' ? 'অ্যালার্ট সেটিংস' : 'পেমেন্ট রিমাইন্ডার'}</label>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        value={formData.alertDays}
                                                        onChange={(e) => setFormData({...formData, alertDays: parseInt(e.target.value) || 0})}
                                                        className="w-20 px-4 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold"
                                                    />
                                                    <select 
                                                        value={formData.alertType}
                                                        onChange={(e) => setFormData({...formData, alertType: e.target.value as 'before' | 'after'})}
                                                        className="flex-1 px-4 py-4 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500"
                                                    >
                                                        <option value="before">আগে (Before)</option>
                                                        <option value="after">পরে (After)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-6 border-t border-slate-50">
                                            <div className="flex items-center justify-between px-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#045c84]">কত {formData.interval === 'monthly' ? 'মাসের' : 'বারের'} বকেয়া (Cycles)</label>
                                                <div className="w-12 h-12 bg-[#045c84]/10 text-[#045c84] border border-[#045c84]/20 rounded-2xl flex items-center justify-center font-black text-sm">
                                                    {formData.cycleCount}
                                                </div>
                                            </div>
                                            <div className="px-2">
                                                <input 
                                                    type="range" 
                                                    min="1" 
                                                    max="12" 
                                                    value={formData.cycleCount}
                                                    onChange={(e) => setFormData({ ...formData, cycleCount: parseInt(e.target.value) })}
                                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#045c84]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-4">
                                    {formData.type === 'income' ? 'প্রদানকারী (Provider)' : 'গ্রহণকারী (Recipient)'}
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {['students', 'teachers', 'custom'].map((p) => (
                                        <button 
                                            key={p}
                                            onClick={() => setFormData({...formData, provider: p})}
                                            className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all ${
                                                formData.provider === p ? 'bg-[#045c84] text-white shadow-lg' : 'bg-slate-50 text-slate-400'
                                            }`}
                                        >
                                            {p === 'students' ? 'শিক্ষার্থী' : p === 'teachers' ? 'শিক্ষক' : 'অন্যান্য'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {formData.provider === 'students' && (
                                <div className="space-y-6 bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#045c84]">পরিমাণ নির্ধারণ পদ্ধতি</label>
                                        <div className="space-y-3">
                                            {[
                                                { id: 'flat', label: 'সবার জন্য সমান পরিমাণ', sub: 'প্রতিষ্ঠানের সকল শিক্ষার্থীর জন্য একই পরিমাণ' },
                                                { id: 'per-class', label: 'শ্রেণী অনুযায়ী ভিন্ন পরিমাণ', sub: 'প্রাথমিক, মাধ্যমিক ইত্যাদি অনুযায়ী আলাদা রেট' },
                                                { id: 'per-group', label: 'গ্রুপ অনুযায়ী ভিন্ন পরিমাণ', sub: 'বিজ্ঞান, মানবিক ইত্যাদি গ্রুপ অনুযায়ী আলাদা রেট' },
                                            ].map((opt) => (
                                                <button 
                                                    key={opt.id}
                                                    onClick={() => setFormData({...formData, studentAmountType: opt.id as any})}
                                                    className={`w-full p-6 bg-white rounded-3xl border-2 transition-all text-left flex items-center justify-between ${
                                                        formData.studentAmountType === opt.id ? 'border-[#045c84] bg-blue-50/50' : 'border-slate-50'
                                                    }`}
                                                >
                                                    <div>
                                                        <p className="font-black text-slate-800">{opt.label}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{opt.sub}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {formData.studentAmountType === 'flat' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#045c84] px-2">সবার জন্য নির্ধারিত পরিমাণ (৳)</label>
                                            <input 
                                                type="number" 
                                                placeholder="৳ ০.০০"
                                                className="w-full px-8 py-5 bg-white border border-slate-100 rounded-2xl text-xl font-black text-[#045c84]"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                                            />
                                        </div>
                                    )}

                                    {formData.studentAmountType === 'per-class' && (
                                        <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                            {availableClasses.map((cls: any) => (
                                                <div key={cls.id} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100">
                                                    <span className="text-sm font-black text-slate-600 flex-1">{cls.name}</span>
                                                    <input 
                                                        type="number" 
                                                        placeholder="৳ ০.০০"
                                                        value={formData.studentClassAmounts?.[cls.id] || ''}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            studentClassAmounts: { ...formData.studentClassAmounts, [cls.id]: parseFloat(e.target.value) || 0 }
                                                        })}
                                                        className="w-32 bg-slate-50 border-none rounded-xl p-3 text-sm font-black text-[#045c84]"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {formData.studentAmountType === 'per-group' && (
                                        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {availableClasses.map((cls: any) => (
                                                <div key={cls.id} className="bg-white border border-slate-100 rounded-[32px] p-6 space-y-4">
                                                    <div className="flex items-center justify-between border-b pb-4">
                                                        <span className="text-sm font-black text-slate-800">{cls.name}</span>
                                                        <input 
                                                            type="number" 
                                                            placeholder="Base ৳"
                                                            value={formData.studentClassAmounts?.[cls.id] || ''}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                studentClassAmounts: { ...formData.studentClassAmounts, [cls.id]: parseFloat(e.target.value) || 0 }
                                                            })}
                                                            className="w-24 bg-slate-50 border-none rounded-xl p-2 text-xs font-black text-[#045c84]"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {(classGroups[cls.id] || []).map((grp: any) => (
                                                            <div key={grp.id} className="bg-slate-50 p-3 rounded-xl flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-slate-500 flex-1">{grp.name}</span>
                                                                <input 
                                                                    type="number" 
                                                                    placeholder="৳"
                                                                    value={formData.studentGroupAmounts?.[`${cls.id}-${grp.id}`] || ''}
                                                                    onChange={(e) => setFormData({
                                                                        ...formData,
                                                                        studentGroupAmounts: { ...formData.studentGroupAmounts, [`${cls.id}-${grp.id}`]: parseFloat(e.target.value) || 0 }
                                                                    })}
                                                                    className="w-16 bg-white border-none rounded-lg p-1.5 text-[10px] font-black"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {formData.provider === 'teachers' && (
                                <div className="space-y-6 bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#045c84] px-2">বেস অ্যামাউন্ট (৳)</label>
                                        <input 
                                            type="number" 
                                            placeholder="৳ ০.০০"
                                            className="w-full px-8 py-5 bg-white border border-slate-100 rounded-2xl text-xl font-black text-[#045c84]"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                                        />
                                    </div>
                                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">শিক্ষক অনুযায়ী আলাদা অ্যামাউন্ট (ঐচ্ছিক)</label>
                                        {availableTeachers.map((teacher: any) => (
                                            <div key={teacher.id} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 transition-all hover:border-[#045c84]/30">
                                                <div className="w-10 h-10 rounded-xl bg-[#045c84]/5 flex items-center justify-center text-[#045c84] font-black text-xs">
                                                    {teacher.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-black text-slate-700 flex-1">{teacher.name}</span>
                                                <input 
                                                    type="number" 
                                                    placeholder="৳ বেস"
                                                    value={formData.teacherAmounts?.[teacher.id] || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        teacherAmounts: { ...formData.teacherAmounts, [teacher.id]: parseFloat(e.target.value) || 0 }
                                                    })}
                                                    className="w-24 bg-slate-50 border-none rounded-xl p-3 text-xs font-black text-[#045c84]"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {formData.provider === 'custom' && (
                                <div className="space-y-6 bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#045c84]">প্রাপক তালিকা</label>
                                            <button 
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    customRecipients: [...formData.customRecipients, { id: Date.now().toString(), name: '', amount: 0 }]
                                                })}
                                                className="px-4 py-2 bg-white text-[#045c84] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all border border-slate-100"
                                            >
                                                + নতুন প্রাপক
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {formData.customRecipients.map((rec: any, idx: number) => (
                                                <div key={rec.id} className="flex items-center gap-3 bg-white p-4 rounded-3xl border border-slate-100">
                                                    <input 
                                                        type="text" 
                                                        placeholder="প্রাপকের নাম"
                                                        value={rec.name}
                                                        onChange={(e) => {
                                                            const newRecs = [...formData.customRecipients];
                                                            newRecs[idx].name = e.target.value;
                                                            setFormData({...formData, customRecipients: newRecs});
                                                        }}
                                                        className="flex-1 bg-slate-50 border-none rounded-xl p-3 text-xs font-black"
                                                    />
                                                    <input 
                                                        type="number" 
                                                        placeholder="৳ পরিমাণ"
                                                        value={rec.amount || ''}
                                                        onChange={(e) => {
                                                            const newRecs = [...formData.customRecipients];
                                                            newRecs[idx].amount = parseFloat(e.target.value) || 0;
                                                            setFormData({...formData, customRecipients: newRecs});
                                                        }}
                                                        className="w-24 bg-slate-50 border-none rounded-xl p-3 text-xs font-black text-[#045c84]"
                                                    />
                                                    {formData.customRecipients.length > 1 && (
                                                        <button 
                                                            onClick={() => setFormData({
                                                                ...formData,
                                                                customRecipients: formData.customRecipients.filter((_: any, i: number) => i !== idx)
                                                            })}
                                                            className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                                                        >
                                                            <Plus className="rotate-45" size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-900 rounded-[40px] p-8 space-y-4 shadow-2xl">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">মোট প্রাপক</p>
                                            <p className="text-sm font-black text-white">{totalRecipients.toLocaleString('bn-BD')} জন</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">মোট সম্ভাব্য লেনদেন</p>
                                        <p className="text-lg font-black text-emerald-400">৳ {formData.frequencyType === 'unpredictable' ? 'ভ্যারিয়েবল' : totalDue.toLocaleString('bn-BD')}</p>
                                    </div>
                                </div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center italic">
                                    * {formData.frequencyType === 'fixed' ? 'উপরের হিসাবটি আপনার বর্তমান সেটিংস অনুযায়ী একটি সম্ভাব্য হিসাব' : 'অনির্ধারিত সময়ের জন্য লেনদেনের সময় সঠিক পরিমাণ বসাতে হবে'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-10 py-8 border-t border-slate-100 flex items-center justify-between bg-white sticky bottom-0">
                    <button 
                        onClick={() => {
                            if (step === 1) onClose();
                            else setStep(step - 1);
                        }}
                        className="px-8 py-4 text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
                    >
                        {step === 1 ? 'বাতিল করুন' : 'তালিকায় ফিরুন'}
                    </button>
                    <button 
                        onClick={async () => {
                            if (step < 3) setStep(step + 1);
                            else {
                                onSave({ 
                                    ...formData, 
                                    id: initialData?.id || Date.now().toString(),
                                    totalRecipients: totalRecipients.toLocaleString('bn-BD'),
                                    totalDue: formData.frequencyType === 'unpredictable' ? 'ভ্যারিয়েবল' : totalDue.toLocaleString('bn-BD'),
                                    amount: formData.frequencyType === 'unpredictable' ? 'variable' : formData.amount.toString()
                                });
                            }
                        }}
                        className="px-10 py-4 bg-[#045c84] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl transition-all active:scale-95"
                    >
                        {step === 3 ? 'খাত সংরক্ষণ করুন' : 'পরবর্তী ধাপ'}
                    </button>
                </div>
            </div>
        </div>
    );
}
'@

# Find line of marker
$lines = Get-Content -Path $filePath
$markerLine = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match [regex]::Escape($startMarker)) {
        $markerLine = $i
        break
    }
}

if ($markerLine -ge 0) {
    # Replace from markerLine to the end of the file (since the component was at the end mostly)
    # However it might have some closing braces at the very end we want to keep?
    # Actually the component ended at 1107 and total lines is 1108.
    
    $newContentList = New-Object System.Collections.Generic.List[string]
    for ($i = 0; $i -lt $markerLine; $i++) {
        $newContentList.Add($lines[$i])
    }
    
    # Add new code
    $newCodeLines = $newCode -split "`r`n"
    if ($newCodeLines.Length -eq 1) { $newCodeLines = $newCode -split "`n" }
    foreach ($l in $newCodeLines) {
        $newContentList.Add($l)
    }
    
    # We assume the component goes to the very end or near it.
    # Let's see if there is any footer text after the component we need.
    # From earlier view_file, line 1106 was the end of the component.
    
    [IO.File]::WriteAllLines($filePath, $newContentList, [System.Text.Encoding]::UTF8)
    Write-Output "Successfully updated component using scripted injection."
} else {
    Write-Error "Marker not found."
}
