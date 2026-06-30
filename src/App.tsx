import React, { useState, useEffect } from "react";
import { 
  Building2, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  Send, 
  Upload, 
  Download, 
  Trash2, 
  Edit3, 
  Plus, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileCheck, 
  Calendar, 
  Sparkles, 
  RefreshCw, 
  Check, 
  X,
  Eye,
  ChevronRight,
  User,
  Phone,
  Mail,
  HelpCircle,
  QrCode
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Condominium, CondoUnit, UnitPayment, Expense } from "./types";
import CondosTab from "./components/CondosTab";

export default function App() {
  const [activeTab, setActiveTab] = useState<"finance" | "condos" | "expenses" | "reports">("finance");
  
  // Data State
  const [condos, setCondos] = useState<Condominium[]>([]);
  const [payments, setPayments] = useState<UnitPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters / Generation states for Finance tab
  const [financeCondoFilter, setFinanceCondoFilter] = useState<string>("all");
  const [financeMonthFilter, setFinanceMonthFilter] = useState<string>("2026-06");
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [genCondoId, setGenCondoId] = useState("");
  const [genMonth, setGenMonth] = useState("2026-06");
  const [genAmount, setGenAmount] = useState("450");
  const [genDueDate, setGenDueDate] = useState("2026-06-10");

  // Notifications modal state
  const [notifyingPayment, setNotifyingPayment] = useState<UnitPayment | null>(null);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notificationChannel, setNotificationChannel] = useState<"email" | "whatsapp">("email");
  const [isGeneratingNotification, setIsGeneratingNotification] = useState(false);
  const [generatedNotificationText, setGeneratedNotificationText] = useState("");
  const [isNotificationSuccess, setIsNotificationSuccess] = useState(false);

  // IA Parser & New Expense states
  const [emailTextToParse, setEmailTextToParse] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedExpenseDraft, setParsedExpenseDraft] = useState<Partial<Expense> | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

  // Edit Expense modal state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);

  // Reports tab filters
  const [reportCondoFilter, setReportCondoFilter] = useState<string>("all");
  const [reportMonthFilter, setReportMonthFilter] = useState<string>("2026-06");

  // Edit payment modal state
  const [editingPayment, setEditingPayment] = useState<UnitPayment | null>(null);
  const [isEditPaymentOpen, setIsEditPaymentOpen] = useState(false);

  // Global system notification messages
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [condosRes, paymentsRes, expensesRes] = await Promise.all([
        fetch("/api/condos"),
        fetch("/api/payments"),
        fetch("/api/expenses")
      ]);

      if (condosRes.ok && paymentsRes.ok && expensesRes.ok) {
        const condosData = await condosRes.json();
        const paymentsData = await paymentsRes.json();
        const expensesData = await expensesRes.json();

        setCondos(condosData);
        setPayments(paymentsData);
        setExpenses(expensesData);

        if (condosData.length > 0 && !genCondoId) {
          setGenCondoId(condosData[0].id);
        }
      } else {
        showToast("Erro ao sincronizar dados com o servidor.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Não foi possível conectar ao servidor.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Condominium actions
  const handleAddCondo = async (name: string, address: string, units: CondoUnit[]) => {
    try {
      const res = await fetch("/api/condos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address, units })
      });
      if (res.ok) {
        showToast("Condomínio cadastrado com sucesso!");
        await fetchData();
      } else {
        showToast("Erro ao cadastrar condomínio.", "error");
      }
    } catch (e) {
      showToast("Falha na requisição de cadastro.", "error");
    }
  };

  const handleUpdateCondo = async (id: string, name: string, address: string, units: CondoUnit[]) => {
    try {
      const res = await fetch(`/api/condos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address, units })
      });
      if (res.ok) {
        showToast("Condomínio atualizado com sucesso!");
        await fetchData();
      } else {
        showToast("Erro ao atualizar condomínio.", "error");
      }
    } catch (e) {
      showToast("Falha na requisição de atualização.", "error");
    }
  };

  const handleDeleteCondo = async (id: string) => {
    try {
      const res = await fetch(`/api/condos/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Condomínio excluído com sucesso!");
        await fetchData();
      } else {
        showToast("Erro ao excluir condomínio.", "error");
      }
    } catch (e) {
      showToast("Falha na requisição de exclusão.", "error");
    }
  };

  // Payment actions
  const handleGeneratePayments = async () => {
    if (!genCondoId) {
      showToast("Selecione um condomínio válido.", "error");
      return;
    }
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condoId: genCondoId,
          month: genMonth,
          amount: parseFloat(genAmount),
          dueDate: genDueDate
        })
      });
      if (res.ok) {
        const result = await res.json();
        showToast(`Mensalidades geradas em lote para ${result.count} unidades!`);
        setIsGenerateModalOpen(false);
        await fetchData();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Erro ao gerar mensalidades.", "error");
      }
    } catch (e) {
      showToast("Falha ao gerar cobranças.", "error");
    }
  };

  const handleUpdatePaymentStatus = async (id: string, updatedFields: Partial<UnitPayment>) => {
    try {
      const res = await fetch(`/api/payments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        showToast("Pagamento atualizado com sucesso.");
        setIsEditPaymentOpen(false);
        setEditingPayment(null);
        await fetchData();
      } else {
        showToast("Erro ao atualizar pagamento.", "error");
      }
    } catch (e) {
      showToast("Falha na atualização de pagamento.", "error");
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta cobrança de mensalidade?")) return;
    try {
      const res = await fetch(`/api/payments/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Cobrança removida.");
        await fetchData();
      }
    } catch (e) {
      showToast("Erro ao excluir cobrança.", "error");
    }
  };

  // Trigger Notification Flow with Gemini
  const handleOpenNotifyModal = async (payment: UnitPayment) => {
    setNotifyingPayment(payment);
    setIsNotifyModalOpen(true);
    setIsGeneratingNotification(true);
    setGeneratedNotificationText("");
    setIsNotificationSuccess(false);

    try {
      const res = await fetch(`/api/payments/${payment.id}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: notificationChannel })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedNotificationText(data.notification.content);
      } else {
        showToast("Erro ao obter texto inteligente de notificação.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Erro na comunicação com a API de IA.", "error");
    } finally {
      setIsGeneratingNotification(false);
    }
  };

  const handleRegenerateNotification = async (channel: "email" | "whatsapp") => {
    if (!notifyingPayment) return;
    setNotificationChannel(channel);
    setIsGeneratingNotification(true);
    try {
      const res = await fetch(`/api/payments/${notifyingPayment.id}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedNotificationText(data.notification.content);
      }
    } catch (e) {
      showToast("Falha ao recriar notificação.", "error");
    } finally {
      setIsGeneratingNotification(false);
    }
  };

  const handleSendNotification = () => {
    setIsNotificationSuccess(true);
    showToast("Notificação simulada como disparada com sucesso!");
    setTimeout(() => {
      setIsNotifyModalOpen(false);
      setNotifyingPayment(null);
      fetchData();
    }, 2000);
  };

  // Expense parser email & files
  const handleParseEmailText = async () => {
    if (!emailTextToParse.trim()) {
      showToast("Por favor, insira o texto do e-mail.", "error");
      return;
    }
    setIsParsing(true);
    try {
      const res = await fetch("/api/expenses/parse-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: emailTextToParse })
      });
      if (res.ok) {
        const data = await res.json();
        setParsedExpenseDraft(data);
        showToast("E-mail lido e processado com sucesso!");
      } else {
        showToast("Erro ao interpretar texto do e-mail.", "error");
      }
    } catch (e) {
      showToast("Falha na interpretação inteligente.", "error");
    } finally {
      setIsParsing(false);
    }
  };

  // Document extraction
  const handleDocumentUpload = async (file: File) => {
    setIsParsing(true);
    setUploadedFileName(file.name);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const res = await fetch("/api/expenses/parse-doc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileData: base64data,
            fileName: file.name,
            mimeType: file.type,
            rawText: `Arquivo de fatura em lote. Nome do documento: ${file.name}`
          })
        });

        if (res.ok) {
          const data = await res.json();
          setParsedExpenseDraft(data);
          showToast("Nota Fiscal / Boleto analisada pela IA!");
        } else {
          showToast("Erro ao processar imagem ou PDF da fatura.", "error");
        }
        setIsParsing(false);
      };
    } catch (err) {
      console.error(err);
      showToast("Falha ao carregar arquivo local.", "error");
      setIsParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleDocumentUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSaveDraftExpense = async () => {
    if (!parsedExpenseDraft) return;
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedExpenseDraft)
      });
      if (res.ok) {
        showToast("Despesa salva com sucesso na lista de Pendentes!");
        setParsedExpenseDraft(null);
        setEmailTextToParse("");
        setUploadedFileName("");
        await fetchData();
      } else {
        showToast("Erro ao registrar despesa.", "error");
      }
    } catch (e) {
      showToast("Falha ao salvar despesa.", "error");
    }
  };

  // Expense List CRUD and Launch
  const handleLaunchExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}/launch`, { method: "POST" });
      if (res.ok) {
        showToast("Despesa lançada oficialmente no sistema financeiro!");
        await fetchData();
      } else {
        showToast("Erro ao lançar despesa.", "error");
      }
    } catch (e) {
      showToast("Erro ao processar lançamento.", "error");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta despesa?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Despesa removida.");
        await fetchData();
      }
    } catch (e) {
      showToast("Erro ao excluir despesa.", "error");
    }
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    try {
      const res = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingExpense)
      });
      if (res.ok) {
        showToast("Despesa atualizada com sucesso.");
        setIsEditExpenseOpen(false);
        setEditingExpense(null);
        await fetchData();
      } else {
        showToast("Erro ao salvar despesa.", "error");
      }
    } catch (e) {
      showToast("Falha na requisição de edição.", "error");
    }
  };

  // CSV Report exporter helper
  const handleExportCSV = (reportData: { title: string; revenue: UnitPayment[]; expenses: Expense[]; totalRev: number; totalExp: number }) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Relatorio de Conferencia Contabil - CondoGesto\n`;
    csvContent += `Parametros: ${reportData.title}\n\n`;
    
    csvContent += `--- ENTRADAS (MENSALIDADES PAGAS) ---\n`;
    csvContent += "Condominio,Unidade,Proprietario,Valor,Vencimento,Status\n";
    reportData.revenue.forEach(r => {
      csvContent += `"${r.condoName}","${r.unitNumber}","${r.ownerName}",R$ ${r.amount.toFixed(2)},"${r.dueDate}","${r.status}"\n`;
    });
    csvContent += `Total Entradas:,,R$ ${reportData.totalRev.toFixed(2)},,,\n\n`;

    csvContent += `--- SAIDAS (REABASTECIMENTOS E DESPESAS LANCADAS) ---\n`;
    csvContent += "Condominio,Fornecedor,Descricao,Nota Fiscal,Vencimento,Valor\n";
    reportData.expenses.forEach(e => {
      csvContent += `"${e.condoName}","${e.provider}","${e.description}","${e.invoiceNumber}","${e.dueDate}",R$ ${e.amount.toFixed(2)}\n`;
    });
    csvContent += `Total Saidas:,,R$ ${reportData.totalExp.toFixed(2)},,,\n\n`;
    
    csvContent += `SALDO LIQUIDO CONCILIADO:,,R$ ${(reportData.totalRev - reportData.totalExp).toFixed(2)},,,\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Fechamento_Contabil_${reportMonthFilter}_CondoGesto.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Planilha de conciliação CSV gerada com sucesso!");
  };

  // Computations
  const filteredPayments = payments.filter(p => {
    const matchCondo = financeCondoFilter === "all" || p.condoId === financeCondoFilter;
    const matchMonth = !financeMonthFilter || p.month === financeMonthFilter;
    return matchCondo && matchMonth;
  });

  // Calculate high-level stats for dashboard display
  const totalReceivables = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = payments.filter(p => p.status === "Pago").reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = payments.filter(p => p.status === "Pendente").reduce((acc, curr) => acc + curr.amount, 0);
  const totalOverdue = payments.filter(p => p.status === "Atrasado").reduce((acc, curr) => acc + curr.amount, 0);

  const pendingExpensesCount = expenses.filter(e => e.status === "Pendente").length;
  const launchedExpensesAmount = expenses.filter(e => e.status === "Lancado").reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div id="app-root-container" className="min-h-screen bg-[#fdfdfb] flex flex-col font-sans text-[#4a4a40]">
      {/* GLOBAL TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              toast.type === "success" 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BAR (NATURAL TONES) */}
      <header id="main-header" className="h-20 border-b border-[#e5e5d1] bg-white px-6 md:px-10 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#5a5a40] rounded-xl flex items-center justify-center text-white shadow-xs">
            <Building2 size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#2d2d24]">
              CondoGesto <span className="text-[#a0a08b] font-normal text-lg">Pro</span>
            </h1>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav id="desktop-nav" className="hidden md:flex gap-8">
          <button
            id="nav-tab-finance"
            onClick={() => setActiveTab("finance")}
            className={`text-sm font-medium pb-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "finance" 
                ? "border-[#5a5a40] text-[#2d2d24]" 
                : "border-transparent text-[#8c8c7a] hover:text-[#5a5a40]"
            }`}
          >
            Painel Financeiro
          </button>
          <button
            id="nav-tab-condos"
            onClick={() => setActiveTab("condos")}
            className={`text-sm font-medium pb-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "condos" 
                ? "border-[#5a5a40] text-[#2d2d24]" 
                : "border-transparent text-[#8c8c7a] hover:text-[#5a5a40]"
            }`}
          >
            Condomínios
          </button>
          <button
            id="nav-tab-expenses"
            onClick={() => setActiveTab("expenses")}
            className={`text-sm font-medium pb-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "expenses" 
                ? "border-[#5a5a40] text-[#2d2d24]" 
                : "border-transparent text-[#8c8c7a] hover:text-[#5a5a40]"
            }`}
          >
            Lançamento de Despesas
          </button>
          <button
            id="nav-tab-reports"
            onClick={() => setActiveTab("reports")}
            className={`text-sm font-medium pb-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "reports" 
                ? "border-[#5a5a40] text-[#2d2d24]" 
                : "border-transparent text-[#8c8c7a] hover:text-[#5a5a40]"
            }`}
          >
            Relatório Contábil
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            className="p-2 border border-[#dcdcc6] rounded-lg text-[#8c8c7a] hover:text-[#2d2d24] transition hover:bg-[#ecece4] cursor-pointer"
            title="Sincronizar dados"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <div className="w-9 h-9 bg-[#e9e9db] rounded-full border border-[#dcdcc6] flex items-center justify-center text-xs font-semibold text-[#5a5a40]">
            ADM
          </div>
        </div>
      </header>

      {/* MOBILE TABS BAR */}
      <div id="mobile-tabs-bar" className="md:hidden flex border-b border-[#e5e5d1] bg-white sticky top-20 z-30">
        <button
          onClick={() => setActiveTab("finance")}
          className={`flex-1 text-center py-3 text-xs font-medium border-b-2 ${
            activeTab === "finance" ? "border-[#5a5a40] text-[#2d2d24]" : "border-transparent text-[#8c8c7a]"
          }`}
        >
          Financeiro
        </button>
        <button
          onClick={() => setActiveTab("condos")}
          className={`flex-1 text-center py-3 text-xs font-medium border-b-2 ${
            activeTab === "condos" ? "border-[#5a5a40] text-[#2d2d24]" : "border-transparent text-[#8c8c7a]"
          }`}
        >
          Condos
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex-1 text-center py-3 text-xs font-medium border-b-2 ${
            activeTab === "expenses" ? "border-[#5a5a40] text-[#2d2d24]" : "border-transparent text-[#8c8c7a]"
          }`}
        >
          Despesas
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`flex-1 text-center py-3 text-xs font-medium border-b-2 ${
            activeTab === "reports" ? "border-[#5a5a40] text-[#2d2d24]" : "border-transparent text-[#8c8c7a]"
          }`}
        >
          Relatórios
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SIDEBAR SUMMARY (Lg span 3) */}
        <aside id="sidebar-summary" className="lg:col-span-3 space-y-6">
          <div className="bg-[#f8f8f2] border border-[#e5e5d1] rounded-2xl p-5 space-y-5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#a0a08b] block">Visão de Junho/2026</span>
            
            <div className="space-y-4">
              <div className="bg-white p-3 rounded-xl border border-[#e5e5d1] shadow-xs">
                <div className="text-[11px] text-[#8c8c7a]">Recebido de Condôminos</div>
                <div className="text-lg font-bold text-emerald-800">R$ {totalPaid.toFixed(2)}</div>
                <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full" 
                    style={{ width: `${totalReceivables ? (totalPaid / totalReceivables) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#e5e5d1] shadow-xs">
                <div className="text-[11px] text-[#8c8c7a]">Despesas Consolidadas</div>
                <div className="text-lg font-bold text-[#2d2d24]">R$ {launchedExpensesAmount.toFixed(2)}</div>
                <div className="text-[10px] text-[#8c8c7a] mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                  {pendingExpensesCount} despesas pendentes de conferência
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-[#e5e5d1] shadow-xs">
                <div className="text-[11px] text-[#8c8c7a]">Inadimplência de Mensalidades</div>
                <div className="text-sm font-semibold text-rose-700">R$ {totalOverdue.toFixed(2)} em atraso</div>
                <div className="text-[11px] text-[#8c8c7a] mt-0.5">R$ {totalPending.toFixed(2)} pendentes de vencimento</div>
              </div>
            </div>
          </div>

          <div className="bg-[#ecece4] border border-[#dcdcc6] rounded-2xl p-5 space-y-3">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#5a5a40] block">Atalhos e Resumos</span>
            <div className="space-y-2">
              <button
                onClick={() => { setActiveTab("condos"); }}
                className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-white/40 text-xs text-[#2d2d24] font-medium transition cursor-pointer"
              >
                <Plus size={14} className="text-[#5a5a40]" />
                Cadastrar Novo Condomínio
              </button>
              <button
                onClick={() => { setActiveTab("finance"); setIsGenerateModalOpen(true); }}
                className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-white/40 text-xs text-[#2d2d24] font-medium transition cursor-pointer"
              >
                <Sparkles size={14} className="text-[#5a5a40]" />
                Gerar Cobranças Mensais
              </button>
              <button
                onClick={() => { setActiveTab("expenses"); }}
                className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-white/40 text-xs text-[#2d2d24] font-medium transition cursor-pointer"
              >
                <FileText size={14} className="text-[#5a5a40]" />
                Anexar Boleto ou Nota Fiscal
              </button>
            </div>
          </div>
        </aside>

        {/* WORKSPACE AREA (Lg span 9) */}
        <section id="workspace-area" className="lg:col-span-9 space-y-6">

          {/* TAB 1: PAINEL FINANCEIRO (MENSALIDADES) */}
          {activeTab === "finance" && (
            <div id="panel-finance-tab" className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-[#e5e5d1] flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <div>
                  <h2 className="text-xl font-bold text-[#2d2d24]">Gestão de Mensalidades</h2>
                  <p className="text-xs text-[#8c8c7a]">Gere as mensalidades das unidades e acompanhe o fluxo de recebimentos em tempo real.</p>
                </div>
                <button
                  id="btn-open-generate-modal"
                  onClick={() => setIsGenerateModalOpen(true)}
                  className="px-4 py-2 bg-[#5a5a40] hover:bg-[#4a4a33] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition"
                >
                  <Plus size={15} />
                  Gerar Lote Mensal
                </button>
              </div>

              {/* Filters panel */}
              <div className="bg-[#f8f8f2] border border-[#e5e5d1] p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-[#8c8c7a] block">Filtrar por Condomínio</label>
                    <select
                      id="select-finance-condo"
                      value={financeCondoFilter}
                      onChange={(e) => setFinanceCondoFilter(e.target.value)}
                      className="bg-white border border-[#dcdcc6] rounded-lg px-3 py-1.5 text-xs focus:outline-hidden text-[#2d2d24]"
                    >
                      <option value="all">-- Todos os Condomínios --</option>
                      {condos.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-[#8c8c7a] block">Mês de Referência</label>
                    <input
                      id="input-finance-month"
                      type="month"
                      value={financeMonthFilter}
                      onChange={(e) => setFinanceMonthFilter(e.target.value)}
                      className="bg-white border border-[#dcdcc6] rounded-lg px-3 py-1 text-xs focus:outline-hidden text-[#2d2d24]"
                    />
                  </div>
                </div>

                <div className="text-xs text-[#8c8c7a] font-medium">
                  {filteredPayments.length} registros encontrados
                </div>
              </div>

              {/* Payments table */}
              <div className="bg-white border border-[#e5e5d1] rounded-2xl overflow-hidden">
                {filteredPayments.length === 0 ? (
                  <div className="text-center py-16">
                    <AlertCircle size={32} className="mx-auto text-[#8c8c7a] mb-2" />
                    <p className="text-sm font-semibold text-[#2d2d24]">Nenhuma cobrança registrada neste período.</p>
                    <p className="text-xs text-[#8c8c7a] mt-1">Gere as cobranças utilizando o botão "Gerar Lote Mensal" acima.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-[#4a4a40]">
                      <thead className="bg-[#f8f8f2] text-[#2d2d24] uppercase tracking-wider font-semibold border-b border-[#e5e5d1]">
                        <tr>
                          <th className="px-6 py-4">Condomínio / Unidade</th>
                          <th className="px-6 py-4">Proprietário</th>
                          <th className="px-6 py-4">Valor</th>
                          <th className="px-6 py-4">Vencimento</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Notificação IA</th>
                          <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e5d1]">
                        {filteredPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-semibold text-[#2d2d24] block text-sm">{p.condoName}</span>
                              <span className="text-[11px] text-[#8c8c7a] bg-[#ecece4] px-1.5 py-0.5 rounded font-mono">Unidade {p.unitNumber}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-medium text-[#2d2d24] block">{p.ownerName}</span>
                              <span className="text-[10px] text-[#8c8c7a] block">{p.ownerEmail || "Sem e-mail"}</span>
                            </td>
                            <td className="px-6 py-4 font-semibold text-[#2d2d24] text-sm">
                              R$ {p.amount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-[#4a4a40]">
                              {p.dueDate ? p.dueDate.split("-").reverse().join("/") : "---"}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
                                p.status === "Pago" 
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : p.status === "Atrasado"
                                    ? "bg-rose-50 text-rose-700 border border-rose-100"
                                    : "bg-amber-50 text-amber-700 border border-amber-100"
                              }`}>
                                {p.status === "Pago" && <CheckCircle size={10} />}
                                {p.status === "Atrasado" && <AlertCircle size={10} />}
                                {p.status === "Pendente" && <Clock size={10} />}
                                {p.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {p.notifications && p.notifications.length > 0 ? (
                                <div className="space-y-1">
                                  <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-sm inline-block border border-emerald-100 font-medium">
                                    Enviado ({p.notifications.length})
                                  </span>
                                  <span className="text-[9px] text-[#8c8c7a] block font-mono">
                                    Último: {new Date(p.notifications[p.notifications.length - 1].sentAt).toLocaleDateString("pt-BR")}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-[#8c8c7a] italic">Sem notificações</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  id={`btn-notify-payment-${p.id}`}
                                  onClick={() => handleOpenNotifyModal(p)}
                                  className="px-2.5 py-1.5 bg-[#ecece4] hover:bg-[#5a5a40] text-[#5a5a40] hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                                  title="Enviar Lembrete IA"
                                >
                                  <Send size={12} />
                                  Notificar
                                </button>
                                <button
                                  id={`btn-edit-payment-${p.id}`}
                                  onClick={() => {
                                    setEditingPayment(p);
                                    setIsEditPaymentOpen(true);
                                  }}
                                  className="p-1.5 border border-[#dcdcc6] rounded-lg text-[#8c8c7a] hover:text-[#2d2d24] transition hover:bg-[#ecece4] cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  id={`btn-delete-payment-${p.id}`}
                                  onClick={() => handleDeletePayment(p.id)}
                                  className="p-1.5 border border-[#dcdcc6] rounded-lg text-[#8c8c7a] hover:text-red-600 transition hover:bg-red-50 cursor-pointer"
                                  title="Excluir"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CONDOMINIOS (CRUD) */}
          {activeTab === "condos" && (
            <CondosTab 
              condos={condos} 
              onAddCondo={handleAddCondo} 
              onUpdateCondo={handleUpdateCondo} 
              onDeleteCondo={handleDeleteCondo} 
            />
          )}

          {/* TAB 3: DESPESAS & IMPORTADOR IA */}
          {activeTab === "expenses" && (
            <div id="expenses-workspace-container" className="space-y-6">
              
              {/* INTRO BAR */}
              <div className="bg-white p-6 rounded-2xl border border-[#e5e5d1] shadow-xs">
                <h2 className="text-xl font-bold text-[#2d2d24]">Importação Inteligente & Lançamento</h2>
                <p className="text-xs text-[#8c8c7a] mt-1">
                  Cole textos de e-mails, fatura ou anexe uma foto do boleto. A inteligência artificial do **Gemini** lerá o documento e extrairá a despesa de reabastecimento preenchendo as informações automaticamente.
                </p>
              </div>

              {/* TWO COLUMN IA INPUT + DRAFT PREVIEW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* COLUMN 1: INTERFACES DE IMPORTACAO */}
                <div className="bg-[#ecece4] rounded-3xl border border-[#dcdcc6] p-6 flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[#5a5a40] flex items-center gap-1.5">
                      <Sparkles size={16} />
                      Importador Inteligente
                    </h3>
                    <span className="text-[9px] text-white bg-[#5a5a40] px-2 py-0.5 rounded-full font-semibold">GEMINI AI</span>
                  </div>

                  <div className="space-y-4 flex-1">
                    {/* Paste Area */}
                    <div className="space-y-1">
                      <label className="text-xs text-[#4a4a40] font-semibold">Opção A: Colar texto de e-mail recebido</label>
                      <textarea
                        id="textarea-email-import"
                        rows={4}
                        value={emailTextToParse}
                        onChange={(e) => setEmailTextToParse(e.target.value)}
                        className="w-full bg-white/70 border border-[#dcdcc6] rounded-xl p-3 text-xs focus:ring-1 focus:ring-[#5a5a40] focus:outline-hidden text-[#2d2d24]"
                        placeholder="Ex: Prezada administração, informamos que o abastecimento de gás GLP foi finalizado hoje na torre Aurora Borealis no valor de R$ 1.850,40, boleto anexo com vencimento dia 15/10/2026. Chave da Nota Fiscal: 88291..."
                      />
                    </div>

                    <div className="flex items-center my-2">
                      <hr className="flex-1 border-[#dcdcc6]" />
                      <span className="px-2 text-[10px] text-[#8c8c7a] uppercase font-bold">ou</span>
                      <hr className="flex-1 border-[#dcdcc6]" />
                    </div>

                    {/* Drag and Drop File Area */}
                    <div className="space-y-1">
                      <label className="text-xs text-[#4a4a40] font-semibold">Opção B: Puxar Boleto ou Nota Fiscal (Imagem/PDF)</label>
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                          dragActive 
                            ? "border-[#5a5a40] bg-[#e5e5d1]/30" 
                            : "border-[#dcdcc6] bg-white/40 hover:bg-white/60"
                        }`}
                        onClick={() => {
                          const el = document.getElementById("file-upload-input");
                          if (el) el.click();
                        }}
                      >
                        <input
                          id="file-upload-input"
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleDocumentUpload(e.target.files[0]);
                            }
                          }}
                        />
                        <Upload size={24} className="mx-auto text-[#8c8c7a] mb-2" />
                        <span className="text-[11px] text-[#4a4a40] font-bold block uppercase tracking-wider">
                          Anexar Boleto / NF
                        </span>
                        <span className="text-[10px] text-[#8c8c7a] mt-1 block">
                          {uploadedFileName ? `Selecionado: ${uploadedFileName}` : "Arraste aqui ou clique para selecionar"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <button
                      id="btn-trigger-parse-email"
                      onClick={handleParseEmailText}
                      disabled={isParsing || !emailTextToParse.trim()}
                      className="w-full py-2.5 bg-white text-[#5a5a40] hover:bg-[#f8f8f2] font-bold text-xs rounded-xl shadow-xs border border-[#dcdcc6] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                    >
                      {isParsing ? "Processando com IA..." : "Processar com Gemini"}
                    </button>
                  </div>
                </div>

                {/* COLUMN 2: DRAFT PREVIEW & VERIFICATION FORM */}
                <div className="bg-white rounded-3xl border border-[#e5e5d1] p-6 space-y-4">
                  <h3 className="font-semibold text-[#2d2d24] text-sm flex items-center gap-1.5">
                    <FileCheck size={18} className="text-[#5a5a40]" />
                    Conferência da Despesa Extraída
                  </h3>

                  {parsedExpenseDraft ? (
                    <div id="parsed-expense-draft-form" className="space-y-4">
                      <div className="text-xs text-[#8c8c7a] bg-[#f8f8f2] p-2.5 rounded-lg border border-[#e5e5d1]">
                        🚨 Verifique se as informações abaixo estão corretas antes de "Lançar" ou salvar a despesa.
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#8c8c7a]">Nome do Condomínio</label>
                          <select
                            value={parsedExpenseDraft.condoId || ""}
                            onChange={(e) => {
                              const selCondo = condos.find(c => c.id === e.target.value);
                              setParsedExpenseDraft({
                                ...parsedExpenseDraft,
                                condoId: e.target.value,
                                condoName: selCondo ? selCondo.name : "Sem Condomínio"
                              });
                            }}
                            className="w-full p-2 border border-[#dcdcc6] rounded-lg text-xs"
                          >
                            <option value="">-- Não Reconhecido (Escolha da Lista) --</option>
                            {condos.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#8c8c7a]">Vencimento Boleto</label>
                          <input
                            type="date"
                            value={parsedExpenseDraft.dueDate || ""}
                            onChange={(e) => setParsedExpenseDraft({ ...parsedExpenseDraft, dueDate: e.target.value })}
                            className="w-full p-2 border border-[#dcdcc6] rounded-lg text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#8c8c7a]">Nº Nota Fiscal (NF)</label>
                          <input
                            type="text"
                            placeholder="NF-e"
                            value={parsedExpenseDraft.invoiceNumber || ""}
                            onChange={(e) => setParsedExpenseDraft({ ...parsedExpenseDraft, invoiceNumber: e.target.value })}
                            className="w-full p-2 border border-[#dcdcc6] rounded-lg text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#8c8c7a]">Fornecedor</label>
                          <input
                            type="text"
                            placeholder="Empresa"
                            value={parsedExpenseDraft.provider || ""}
                            onChange={(e) => setParsedExpenseDraft({ ...parsedExpenseDraft, provider: e.target.value })}
                            className="w-full p-2 border border-[#dcdcc6] rounded-lg text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#8c8c7a]">Valor (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={parsedExpenseDraft.amount || ""}
                            onChange={(e) => setParsedExpenseDraft({ ...parsedExpenseDraft, amount: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2 border border-[#dcdcc6] rounded-lg text-xs font-semibold"
                          />
                        </div>

                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] uppercase font-bold text-[#8c8c7a]">Descrição do Abastecimento</label>
                          <input
                            type="text"
                            placeholder="Manutenção ou compra..."
                            value={parsedExpenseDraft.description || ""}
                            onChange={(e) => setParsedExpenseDraft({ ...parsedExpenseDraft, description: e.target.value })}
                            className="w-full p-2 border border-[#dcdcc6] rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => setParsedExpenseDraft(null)}
                          className="flex-1 py-2 border border-[#dcdcc6] rounded-lg text-xs text-[#8c8c7a] font-medium hover:bg-slate-50 cursor-pointer"
                        >
                          Limpar Rascunho
                        </button>
                        <button
                          id="btn-confirm-save-expense"
                          onClick={handleSaveDraftExpense}
                          className="flex-1 py-2 bg-[#5a5a40] text-white rounded-lg text-xs font-semibold hover:bg-[#4a4a33] cursor-pointer"
                        >
                          Salvar Despesa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-[#fdfdfb]">
                      <Sparkles size={24} className="text-[#a0a08b] animate-pulse mb-2" />
                      <p className="text-xs font-semibold text-[#4a4a40]">Nenhum rascunho de IA ativo.</p>
                      <p className="text-[11px] text-[#8c8c7a] mt-1 px-4">Utilize o painel ao lado para processar um e-mail ou nota fiscal recebida.</p>
                    </div>
                  )}

                </div>
              </div>

              {/* LIST OF EXSTING EXPENSES */}
              <div className="bg-white border border-[#e5e5d1] rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg text-[#2d2d24]">Todas as Despesas de Reabastecimento</h3>
                    <p className="text-xs text-[#8c8c7a]">Revise despesas pendentes, corrija eventuais erros e faça o lançamento para a contabilidade.</p>
                  </div>
                  <span className="text-xs bg-[#ecece4] text-[#5a5a40] font-bold px-3 py-1 rounded-full border border-[#dcdcc6]">
                    {expenses.length} Total
                  </span>
                </div>

                {expenses.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-100 rounded-xl">
                    <p className="text-sm text-[#8c8c7a]">Nenhuma despesa adicionada ainda.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#e5e5d1]">
                    <table className="w-full text-left text-xs text-[#4a4a40]">
                      <thead className="bg-[#f8f8f2] text-[#2d2d24] uppercase tracking-wider font-semibold border-b border-[#e5e5d1]">
                        <tr>
                          <th className="px-5 py-3.5">Condomínio</th>
                          <th className="px-5 py-3.5">Fornecedor / Descrição</th>
                          <th className="px-5 py-3.5">Nota Fiscal</th>
                          <th className="px-5 py-3.5">Vencimento Boleto</th>
                          <th className="px-5 py-3.5">Valor (R$)</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e5d1]">
                        {expenses.map((e) => (
                          <tr key={e.id} className={`hover:bg-slate-50/50 transition-colors ${e.status === "Lancado" ? "opacity-65" : ""}`}>
                            <td className="px-5 py-4">
                              <span className="font-bold text-[#2d2d24] text-sm block">{e.condoName}</span>
                              <span className="text-[9px] text-slate-500 font-mono">ID: {e.id}</span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="font-semibold text-[#2d2d24] block">{e.provider}</span>
                              <span className="text-[#8c8c7a] block text-[11px] truncate max-w-xs">{e.description}</span>
                            </td>
                            <td className="px-5 py-4 font-mono text-slate-700">
                              {e.invoiceNumber || <span className="text-rose-600 font-sans italic text-[10px]">Não informado</span>}
                            </td>
                            <td className="px-5 py-4 text-[#4a4a40]">
                              {e.dueDate ? e.dueDate.split("-").reverse().join("/") : "---"}
                            </td>
                            <td className="px-5 py-4 font-bold text-[#2d2d24] text-sm">
                              R$ {e.amount.toFixed(2)}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                e.status === "Lancado"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                                  : "bg-amber-50 text-amber-800 border-amber-100"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${e.status === "Lancado" ? "bg-emerald-600" : "bg-amber-500"}`}></span>
                                {e.status === "Lancado" ? "Lançada" : "Pendente"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex gap-2 justify-end">
                                {e.status === "Pendente" ? (
                                  <>
                                    <button
                                      id={`btn-launch-expense-${e.id}`}
                                      onClick={() => handleLaunchExpense(e.id)}
                                      className="px-3 py-1.5 bg-[#5a5a40] hover:bg-[#4a4a33] text-white text-[11px] font-bold rounded-lg shadow-sm transition cursor-pointer"
                                    >
                                      Lançar no Sistema
                                    </button>
                                    <button
                                      id={`btn-edit-expense-${e.id}`}
                                      onClick={() => {
                                        setEditingExpense(e);
                                        setIsEditExpenseOpen(true);
                                      }}
                                      className="p-1.5 border border-[#dcdcc6] rounded-lg text-[#8c8c7a] hover:text-[#2d2d24] hover:bg-[#ecece4] transition cursor-pointer"
                                      title="Editar"
                                    >
                                      <Edit3 size={13} />
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded border border-emerald-100 inline-block">
                                    ✓ Lançada
                                  </span>
                                )}
                                <button
                                  id={`btn-delete-expense-${e.id}`}
                                  onClick={() => handleDeleteExpense(e.id)}
                                  className="p-1.5 border border-[#dcdcc6] rounded-lg text-[#8c8c7a] hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                  title="Excluir"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RELATORIO CONTABIL */}
          {activeTab === "reports" && (
            <div id="accounting-reports-panel" className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-[#e5e5d1] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#2d2d24]">Fechamento & Conferência Contábil</h2>
                  <p className="text-xs text-[#8c8c7a]">Gere planilhas consolidadas contendo as mensalidades e gastos efetuados para facilitar a contabilidade externa.</p>
                </div>
                
                {/* Export Button */}
                <button
                  id="btn-export-accounting"
                  onClick={() => {
                    const selCondo = condos.find(c => c.id === reportCondoFilter);
                    const titleStr = `${selCondo ? selCondo.name : "Todos os Condomínios"} - Período ${reportMonthFilter}`;
                    
                    const reportPaidPayments = payments.filter(p => p.status === "Pago" && (reportCondoFilter === "all" || p.condoId === reportCondoFilter) && (!reportMonthFilter || p.month === reportMonthFilter));
                    const reportLaunchedExpenses = expenses.filter(e => e.status === "Lancado" && (reportCondoFilter === "all" || e.condoId === reportCondoFilter) && (!reportMonthFilter || (e.dueDate && e.dueDate.startsWith(reportMonthFilter))));
                    
                    const reportTotalRev = reportPaidPayments.reduce((acc, curr) => acc + curr.amount, 0);
                    const reportTotalExp = reportLaunchedExpenses.reduce((acc, curr) => acc + curr.amount, 0);

                    handleExportCSV({
                      title: titleStr,
                      revenue: reportPaidPayments,
                      expenses: reportLaunchedExpenses,
                      totalRev: reportTotalRev,
                      totalExp: reportTotalExp
                    });
                  }}
                  className="px-4 py-2.5 bg-[#5a5a40] hover:bg-[#4a4a33] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Download size={15} />
                  Exportar Relatório Mensal
                </button>
              </div>

              {/* Filters panel */}
              <div className="bg-[#f8f8f2] border border-[#e5e5d1] p-5 rounded-2xl flex flex-wrap gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#8c8c7a] block">Filtrar Condomínio</label>
                  <select
                    id="select-report-condo"
                    value={reportCondoFilter}
                    onChange={(e) => setReportCondoFilter(e.target.value)}
                    className="bg-white border border-[#dcdcc6] rounded-lg px-3 py-1.5 text-xs text-[#2d2d24]"
                  >
                    <option value="all">-- Todos os Condomínios --</option>
                    {condos.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-[#8c8c7a] block">Filtrar Mês</label>
                  <input
                    id="input-report-month"
                    type="month"
                    value={reportMonthFilter}
                    onChange={(e) => setReportMonthFilter(e.target.value)}
                    className="bg-white border border-[#dcdcc6] rounded-lg px-3 py-1.5 text-xs text-[#2d2d24]"
                  />
                </div>
              </div>

              {/* Financial Balance Summary Card */}
              {(() => {
                const reportPaidPayments = payments.filter(p => p.status === "Pago" && (reportCondoFilter === "all" || p.condoId === reportCondoFilter) && (!reportMonthFilter || p.month === reportMonthFilter));
                const reportLaunchedExpenses = expenses.filter(e => e.status === "Lancado" && (reportCondoFilter === "all" || e.condoId === reportCondoFilter) && (!reportMonthFilter || (e.dueDate && e.dueDate.startsWith(reportMonthFilter))));
                
                const reportTotalRev = reportPaidPayments.reduce((acc, curr) => acc + curr.amount, 0);
                const reportTotalExp = reportLaunchedExpenses.reduce((acc, curr) => acc + curr.amount, 0);
                const reportNetBalance = reportTotalRev - reportTotalExp;

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl border border-[#e5e5d1] shadow-xs">
                        <span className="text-[10px] uppercase font-bold text-[#8c8c7a] block tracking-wider">Entradas Recebidas (Mensalidades)</span>
                        <div className="text-2xl font-bold text-emerald-800 mt-2">R$ {reportTotalRev.toFixed(2)}</div>
                        <span className="text-xs text-slate-500 mt-1 block">{reportPaidPayments.length} mensalidades quitadas</span>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-[#e5e5d1] shadow-xs">
                        <span className="text-[10px] uppercase font-bold text-[#8c8c7a] block tracking-wider">Saídas Efetuadas (Despesas Lançadas)</span>
                        <div className="text-2xl font-bold text-rose-800 mt-2">R$ {reportTotalExp.toFixed(2)}</div>
                        <span className="text-xs text-slate-500 mt-1 block">{reportLaunchedExpenses.length} notas lançadas</span>
                      </div>

                      <div className={`p-6 rounded-2xl border shadow-xs ${reportNetBalance >= 0 ? "bg-[#ecece4] border-[#dcdcc6]" : "bg-red-50 border-red-200"}`}>
                        <span className="text-[10px] uppercase font-bold text-[#5a5a40] block tracking-wider">Saldo Líquido</span>
                        <div className={`text-2xl font-bold mt-2 ${reportNetBalance >= 0 ? "text-[#2d2d24]" : "text-rose-900"}`}>
                          R$ {reportNetBalance.toFixed(2)}
                        </div>
                        <span className="text-xs text-slate-500 mt-1 block">Superávit operacional apurado</span>
                      </div>
                    </div>

                    {/* Breakdown Detail Listings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left: Detail Revenues */}
                      <div className="bg-white rounded-2xl border border-[#e5e5d1] p-5 space-y-4">
                        <h3 className="font-semibold text-sm text-[#2d2d24] flex items-center gap-1">
                          <CheckCircle size={16} className="text-emerald-600" />
                          Detalhamento de Entradas
                        </h3>
                        {reportPaidPayments.length === 0 ? (
                          <div className="text-center py-6 text-xs text-[#8c8c7a] italic">Nenhum pagamento registrado</div>
                        ) : (
                          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                            {reportPaidPayments.map(p => (
                              <div key={p.id} className="py-2.5 flex justify-between items-center text-xs">
                                <div>
                                  <span className="font-semibold text-slate-800 block">Apto {p.unitNumber} - {p.ownerName}</span>
                                  <span className="text-[10px] text-[#8c8c7a]">{p.condoName}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold text-emerald-800 block">R$ {p.amount.toFixed(2)}</span>
                                  <span className="text-[9px] text-[#8c8c7a]">Paga: {p.paidAt ? p.paidAt.split("-").reverse().join("/") : "---"}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Detail Expenses */}
                      <div className="bg-white rounded-2xl border border-[#e5e5d1] p-5 space-y-4">
                        <h3 className="font-semibold text-sm text-[#2d2d24] flex items-center gap-1">
                          <FileCheck size={16} className="text-[#5a5a40]" />
                          Detalhamento de Saídas
                        </h3>
                        {reportLaunchedExpenses.length === 0 ? (
                          <div className="text-center py-6 text-xs text-[#8c8c7a] italic">Nenhum gasto lançado</div>
                        ) : (
                          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                            {reportLaunchedExpenses.map(e => (
                              <div key={e.id} className="py-2.5 flex justify-between items-center text-xs">
                                <div>
                                  <span className="font-semibold text-slate-800 block">{e.provider}</span>
                                  <span className="text-[10px] text-[#8c8c7a]">{e.description} - {e.condoName}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-semibold text-rose-800 block">R$ {e.amount.toFixed(2)}</span>
                                  <span className="text-[9px] text-[#8c8c7a]">Vcto: {e.dueDate ? e.dueDate.split("-").reverse().join("/") : "---"}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })()}

            </div>
          )}

        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#e5e5d1] py-8 text-center text-xs text-[#8c8c7a] mt-12">
        <p>© 2026 CondoGesto Pro. Desenvolvido com inteligência artificial para simplificar a administração de condomínios.</p>
        <p className="mt-1 opacity-70">Acesso via Workspace Seguro - Integrado com Gemini AI API</p>
      </footer>

      {/* MODAL: GERAR COBRANÇA EM LOTE */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white max-w-md w-full rounded-2xl border border-[#e5e5d1] p-6 space-y-4 shadow-xl"
          >
            <div className="flex justify-between items-center border-b border-[#e5e5d1] pb-3">
              <h3 className="font-bold text-[#2d2d24] flex items-center gap-1.5 text-lg">
                <Building2 size={18} className="text-[#5a5a40]" />
                Gerar Mensalidades em Lote
              </h3>
              <button 
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-[#8c8c7a] hover:text-[#5a5a40] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-[#8c8c7a]">
              Selecione o condomínio abaixo para gerar automaticamente a cobrança para todas as unidades cadastradas correspondentes ao mês especificado.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#4a4a40]">Condomínio Favorecido</label>
                <select
                  value={genCondoId}
                  onChange={(e) => setGenCondoId(e.target.value)}
                  className="w-full p-2 border border-[#dcdcc6] rounded-lg text-xs"
                >
                  <option value="">-- Selecione o Condomínio --</option>
                  {condos.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#4a4a40]">Mês de Referência</label>
                  <input
                    type="month"
                    value={genMonth}
                    onChange={(e) => setGenMonth(e.target.value)}
                    className="w-full p-1.5 border border-[#dcdcc6] rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#4a4a40]">Vencimento Boleto</label>
                  <input
                    type="date"
                    value={genDueDate}
                    onChange={(e) => setGenDueDate(e.target.value)}
                    className="w-full p-1.5 border border-[#dcdcc6] rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#4a4a40]">Valor Padrão da Taxa (R$)</label>
                <input
                  type="number"
                  placeholder="450.00"
                  value={genAmount}
                  onChange={(e) => setGenAmount(e.target.value)}
                  className="w-full p-2 border border-[#dcdcc6] rounded-lg text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="px-4 py-2 border border-[#dcdcc6] rounded-xl text-xs text-[#4a4a40] font-medium hover:bg-[#f8f8f2] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleGeneratePayments}
                className="px-4 py-2 bg-[#5a5a40] text-white font-semibold rounded-xl text-xs hover:bg-[#4a4a33] transition cursor-pointer"
              >
                Gerar Cobranças
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* MODAL: EDIT MENSALIDADE STATUS/VALOR */}
      {isEditPaymentOpen && editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white max-w-sm w-full rounded-2xl border border-[#e5e5d1] p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#e5e5d1] pb-3">
              <h3 className="font-bold text-[#2d2d24] text-md">Editar Cobrança - Apto {editingPayment.unitNumber}</h3>
              <button onClick={() => { setIsEditPaymentOpen(false); setEditingPayment(null); }} className="text-[#8c8c7a] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#4a4a40]">Status da Mensalidade</label>
                <select
                  value={editingPayment.status}
                  onChange={(e) => setEditingPayment({ ...editingPayment, status: e.target.value as any })}
                  className="w-full p-2 border border-[#dcdcc6] rounded-lg text-xs"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Pago">Pago</option>
                  <option value="Atrasado">Atrasado</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#4a4a40]">Valor Ajustado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingPayment.amount}
                  onChange={(e) => setEditingPayment({ ...editingPayment, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 border border-[#dcdcc6] rounded-lg text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#4a4a40]">Data de Vencimento</label>
                <input
                  type="date"
                  value={editingPayment.dueDate}
                  onChange={(e) => setEditingPayment({ ...editingPayment, dueDate: e.target.value })}
                  className="w-full p-2 border border-[#dcdcc6] rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setIsEditPaymentOpen(false); setEditingPayment(null); }}
                className="px-3 py-1.5 border border-[#dcdcc6] text-xs font-semibold rounded-lg text-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleUpdatePaymentStatus(editingPayment.id, editingPayment)}
                className="px-4 py-1.5 bg-[#5a5a40] text-white text-xs font-semibold rounded-lg hover:bg-[#4a4a33]"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT EXPENSE */}
      {isEditExpenseOpen && editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form 
            onSubmit={handleUpdateExpense} 
            className="bg-white max-w-md w-full rounded-2xl border border-[#e5e5d1] p-6 space-y-4 shadow-xl"
          >
            <div className="flex justify-between items-center border-b border-[#e5e5d1] pb-3">
              <h3 className="font-bold text-[#2d2d24] text-lg">Corrigir Informações da Despesa</h3>
              <button 
                type="button" 
                onClick={() => { setIsEditExpenseOpen(false); setEditingExpense(null); }} 
                className="text-[#8c8c7a] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#4a4a40] block">Condomínio Responsável</label>
                <select
                  value={editingExpense.condoId}
                  onChange={(e) => {
                    const matched = condos.find(c => c.id === e.target.value);
                    setEditingExpense({
                      ...editingExpense,
                      condoId: e.target.value,
                      condoName: matched ? matched.name : "Sem Condomínio"
                    });
                  }}
                  className="w-full p-2 border border-[#dcdcc6] rounded-lg text-xs bg-white"
                >
                  <option value="">-- Escolha o Condomínio --</option>
                  {condos.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#4a4a40] block">Vencimento Boleto</label>
                  <input
                    type="date"
                    required
                    value={editingExpense.dueDate}
                    onChange={(e) => setEditingExpense({ ...editingExpense, dueDate: e.target.value })}
                    className="w-full p-2 border border-[#dcdcc6] rounded-lg text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#4a4a40] block">Número Nota Fiscal (NF)</label>
                  <input
                    type="text"
                    required
                    value={editingExpense.invoiceNumber}
                    onChange={(e) => setEditingExpense({ ...editingExpense, invoiceNumber: e.target.value })}
                    className="w-full p-2 border border-[#dcdcc6] rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#4a4a40] block">Fornecedor</label>
                  <input
                    type="text"
                    required
                    value={editingExpense.provider}
                    onChange={(e) => setEditingExpense({ ...editingExpense, provider: e.target.value })}
                    className="w-full p-2 border border-[#dcdcc6] rounded-lg text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#4a4a40] block">Valor R$</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-[#dcdcc6] rounded-lg text-xs font-bold bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#4a4a40] block">Descrição da Despesa</label>
                <input
                  type="text"
                  required
                  value={editingExpense.description}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="w-full p-2 border border-[#dcdcc6] rounded-lg text-xs bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#e5e5d1] ">
              <button
                type="button"
                onClick={() => { setIsEditExpenseOpen(false); setEditingExpense(null); }}
                className="px-4 py-2 border border-[#dcdcc6] rounded-lg text-xs font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#5a5a40] text-white text-xs font-semibold rounded-lg hover:bg-[#4a4a33]"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: INTELLIGENT COBRANCA NOTIFICATION PREVIEW */}
      {isNotifyModalOpen && notifyingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white max-w-lg w-full rounded-2xl border border-[#e5e5d1] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex justify-between items-center border-b border-[#e5e5d1] pb-3">
              <div>
                <h3 className="font-bold text-[#2d2d24] text-lg flex items-center gap-1">
                  <Sparkles size={18} className="text-[#a0a08b]" />
                  Notificação Inteligente (IA)
                </h3>
                <span className="text-xs text-[#8c8c7a]">Mensagem gerada de forma customizada para a unidade</span>
              </div>
              <button 
                onClick={() => { setIsNotifyModalOpen(false); setNotifyingPayment(null); }}
                className="text-[#8c8c7a] hover:text-[#5a5a40] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Owner Info Bar */}
            <div className="bg-[#f8f8f2] border border-[#e5e5d1] rounded-xl p-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-[#8c8c7a] block uppercase font-bold">Condômino</span>
                <span className="font-semibold text-[#2d2d24] block truncate">{notifyingPayment.ownerName}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8c8c7a] block uppercase font-bold">Unidade</span>
                <span className="font-semibold text-[#2d2d24] block">{notifyingPayment.unitNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#8c8c7a] block uppercase font-bold">Valor Devido</span>
                <span className="font-semibold text-rose-800 block">R$ {notifyingPayment.amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Channel Selection Toggle */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#4a4a40] block">Canal de Envio Pretendido</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRegenerateNotification("email")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    notificationChannel === "email"
                      ? "bg-[#5a5a40] text-white border-[#5a5a40]"
                      : "bg-white border-[#dcdcc6] text-[#4a4a40] hover:bg-[#f8f8f2]"
                  }`}
                >
                  <Mail size={14} />
                  E-mail Formal
                </button>
                <button
                  onClick={() => handleRegenerateNotification("whatsapp")}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    notificationChannel === "whatsapp"
                      ? "bg-emerald-700 text-white border-emerald-700"
                      : "bg-white border-[#dcdcc6] text-[#4a4a40] hover:bg-[#f8f8f2]"
                  }`}
                >
                  <Phone size={14} />
                  WhatsApp Direto
                </button>
              </div>
            </div>

            {/* Generated notification text editor/viewer */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#4a4a40] flex items-center gap-1">
                Texto Redigido
                {isGeneratingNotification && <span className="text-[10px] text-[#5a5a40] font-normal animate-pulse">(Escrevendo mensagem personalizada...)</span>}
              </label>
              <textarea
                rows={8}
                value={generatedNotificationText}
                onChange={(e) => setGeneratedNotificationText(e.target.value)}
                className="w-full p-3 bg-[#fdfdfb] border border-[#dcdcc6] rounded-xl text-xs text-[#2d2d24] focus:outline-hidden font-mono"
                disabled={isGeneratingNotification}
              />
            </div>

            {/* Action footer */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] text-[#8c8c7a] italic">
                A IA CondoGesto adapta o tom dependendo se a fatura já está em atraso ou vencendo.
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setIsNotifyModalOpen(false); setNotifyingPayment(null); }}
                  className="px-3 py-2 border border-[#dcdcc6] rounded-xl text-xs text-[#4a4a40] hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendNotification}
                  disabled={isGeneratingNotification || !generatedNotificationText}
                  className="px-4 py-2 bg-slate-900 text-white hover:bg-black rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {isNotificationSuccess ? (
                    <>
                      <Check size={14} /> Enviando...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Disparar Notificação
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
