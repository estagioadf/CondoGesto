export interface CondoUnit {
  number: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
}

export interface Condominium {
  id: string;
  name: string;
  address: string;
  units: CondoUnit[];
  createdAt: string;
}

export interface UnitPayment {
  id: string;
  condoId: string;
  condoName: string;
  unitNumber: string;
  ownerName: string;
  ownerEmail: string;
  month: string; // Format: "YYYY-MM"
  amount: number;
  dueDate: string; // "YYYY-MM-DD"
  status: "Pendente" | "Pago" | "Atrasado";
  paidAt?: string;
  notifications: {
    id: string;
    sentAt: string;
    channel: "email" | "whatsapp";
    content: string;
  }[];
}

export interface Expense {
  id: string;
  condoId: string; // Empty if not recognized yet
  condoName: string; // Name of condominium
  dueDate: string; // Vencimento do boleto (YYYY-MM-DD)
  invoiceNumber: string; // Número da Nota Fiscal
  provider: string; // Fornecedor
  description: string; // Descrição do reabastecimento/despesa
  amount: number; // Valor em R$
  status: "Pendente" | "Lancado"; // Pendente (Draft) ou Lançado no sistema financeiro
  source: "email" | "documento" | "manual";
  rawText?: string;
  createdAt: string;
}

export interface FinancialReport {
  month: string;
  condoId: string;
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  revenueDetails: UnitPayment[];
  expenseDetails: Expense[];
}
