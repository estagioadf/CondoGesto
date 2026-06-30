import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits for base64 file uploads
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Lazy initialize Gemini SDK client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Database file path
const DB_PATH = path.join(process.cwd(), "db.json");

// Helper to initialize database with mock data if not exists
function initDatabase() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = fs.readFileSync(DB_PATH, "utf-8");
      JSON.parse(data);
      return;
    } catch (e) {
      console.error("Erro ao ler db.json, reinicializando...", e);
    }
  }

  // Initial mock data with 2026 dates
  const initialData = {
    condos: [
      {
        id: "condo-1",
        name: "Condomínio Edifício Residencial Jardins",
        address: "Av. Paulista, 1200 - Bela Vista, São Paulo - SP",
        units: [
          { number: "11", ownerName: "Carlos Souza", ownerEmail: "carlos.souza@email.com", ownerPhone: "(11) 98765-4321" },
          { number: "12", ownerName: "Ana Paula Ramos", ownerEmail: "ana.ramos@email.com", ownerPhone: "(11) 99123-4567" },
          { number: "21", ownerName: "Ricardo Santos", ownerEmail: "ricardo.santos@email.com", ownerPhone: "(11) 97654-3210" },
          { number: "22", ownerName: "Mariana Costa", ownerEmail: "mariana.costa@email.com", ownerPhone: "(11) 98111-2222" },
          { number: "31", ownerName: "Fernanda Lima", ownerEmail: "fernanda.lima@email.com", ownerPhone: "(11) 99555-4433" }
        ],
        createdAt: "2026-01-10T10:00:00Z"
      },
      {
        id: "condo-2",
        name: "Condomínio Residencial Splendor Tower",
        address: "Rua das Alamedas, 450 - Gonzaga, Santos - SP",
        units: [
          { number: "101", ownerName: "Roberto Alencar", ownerEmail: "roberto.alencar@email.com", ownerPhone: "(13) 98877-6655" },
          { number: "102", ownerName: "Juliana Mendes", ownerEmail: "juliana.mendes@email.com", ownerPhone: "(13) 99654-7890" },
          { number: "201", ownerName: "Pedro Henrique Silva", ownerEmail: "pedro.silva@email.com", ownerPhone: "(13) 98122-3344" },
          { number: "202", ownerName: "Beatriz Oliveira", ownerEmail: "beatriz.oliveira@email.com", ownerPhone: "(13) 99191-8282" }
        ],
        createdAt: "2026-02-15T14:30:00Z"
      }
    ],
    payments: [
      // Condo 1 - Junho 2026
      {
        id: "pay-1",
        condoId: "condo-1",
        condoName: "Condomínio Edifício Residencial Jardins",
        unitNumber: "11",
        ownerName: "Carlos Souza",
        ownerEmail: "carlos.souza@email.com",
        month: "2026-06",
        amount: 450.00,
        dueDate: "2026-06-10",
        status: "Pago",
        paidAt: "2026-06-08",
        notifications: []
      },
      {
        id: "pay-2",
        condoId: "condo-1",
        condoName: "Condomínio Edifício Residencial Jardins",
        unitNumber: "12",
        ownerName: "Ana Paula Ramos",
        ownerEmail: "ana.ramos@email.com",
        month: "2026-06",
        amount: 450.00,
        dueDate: "2026-06-10",
        status: "Pago",
        paidAt: "2026-06-10",
        notifications: []
      },
      {
        id: "pay-3",
        condoId: "condo-1",
        condoName: "Condomínio Edifício Residencial Jardins",
        unitNumber: "21",
        ownerName: "Ricardo Santos",
        ownerEmail: "ricardo.santos@email.com",
        month: "2026-06",
        amount: 450.00,
        dueDate: "2026-06-10",
        status: "Pendente",
        notifications: [
          {
            id: "not-1",
            sentAt: "2026-06-12T09:15:00Z",
            channel: "email",
            content: "Prezado Ricardo Santos, lembramos que o boleto de condomínio de Junho/2026 com vencimento em 10/06/2026 no valor de R$ 450.00 está pendente."
          }
        ]
      },
      {
        id: "pay-4",
        condoId: "condo-1",
        condoName: "Condomínio Edifício Residencial Jardins",
        unitNumber: "22",
        ownerName: "Mariana Costa",
        ownerEmail: "mariana.costa@email.com",
        month: "2026-06",
        amount: 450.00,
        dueDate: "2026-06-10",
        status: "Atrasado",
        notifications: [
          {
            id: "not-2",
            sentAt: "2026-06-15T10:00:00Z",
            channel: "email",
            content: "URGENTE: Prezada Mariana Costa, o boleto de condomínio de Junho/2026 (vencimento 10/06/2026) está em atraso. Solicite a segunda via para regularização."
          }
        ]
      },
      {
        id: "pay-5",
        condoId: "condo-1",
        condoName: "Condomínio Edifício Residencial Jardins",
        unitNumber: "31",
        ownerName: "Fernanda Lima",
        ownerEmail: "fernanda.lima@email.com",
        month: "2026-06",
        amount: 450.00,
        dueDate: "2026-06-10",
        status: "Pago",
        paidAt: "2026-06-09",
        notifications: []
      },
      // Condo 2 - Junho 2026
      {
        id: "pay-6",
        condoId: "condo-2",
        condoName: "Condomínio Residencial Splendor Tower",
        unitNumber: "101",
        ownerName: "Roberto Alencar",
        ownerEmail: "roberto.alencar@email.com",
        month: "2026-06",
        amount: 620.00,
        dueDate: "2026-06-15",
        status: "Pago",
        paidAt: "2026-06-14",
        notifications: []
      },
      {
        id: "pay-7",
        condoId: "condo-2",
        condoName: "Condomínio Residencial Splendor Tower",
        unitNumber: "102",
        ownerName: "Juliana Mendes",
        ownerEmail: "juliana.mendes@email.com",
        month: "2026-06",
        amount: 620.00,
        dueDate: "2026-06-15",
        status: "Pago",
        paidAt: "2026-06-15",
        notifications: []
      },
      {
        id: "pay-8",
        condoId: "condo-2",
        condoName: "Condomínio Residencial Splendor Tower",
        unitNumber: "201",
        ownerName: "Pedro Henrique Silva",
        ownerEmail: "pedro.silva@email.com",
        month: "2026-06",
        amount: 620.00,
        dueDate: "2026-06-15",
        status: "Pendente",
        notifications: []
      },
      {
        id: "pay-9",
        condoId: "condo-2",
        condoName: "Condomínio Residencial Splendor Tower",
        unitNumber: "202",
        ownerName: "Beatriz Oliveira",
        ownerEmail: "beatriz.oliveira@email.com",
        month: "2026-06",
        amount: 620.00,
        dueDate: "2026-06-15",
        status: "Pendente",
        notifications: []
      }
    ],
    expenses: [
      {
        id: "exp-1",
        condoId: "condo-1",
        condoName: "Condomínio Edifício Residencial Jardins",
        dueDate: "2026-06-12",
        invoiceNumber: "NF-89410",
        provider: "Ultragaz S/A",
        description: "Reabastecimento de Gás GLP a Granel - Tanque Condomínio",
        amount: 1850.40,
        status: "Lancado",
        source: "documento",
        createdAt: "2026-06-01T09:00:00Z"
      },
      {
        id: "exp-2",
        condoId: "condo-1",
        condoName: "Condomínio Edifício Residencial Jardins",
        dueDate: "2026-06-18",
        invoiceNumber: "NF-12055",
        provider: "AcquaClean Distribuidora",
        description: "Reabastecimento de cloro líquido e manutenção preventiva dos filtros da piscina",
        amount: 320.00,
        status: "Lancado",
        source: "email",
        createdAt: "2026-06-05T14:10:00Z"
      },
      {
        id: "exp-3",
        condoId: "condo-2",
        condoName: "Condomínio Residencial Splendor Tower",
        dueDate: "2026-07-05",
        invoiceNumber: "NF-44012",
        provider: "SuperGás S/A",
        description: "Reabastecimento de gás central do edifício",
        amount: 2400.00,
        status: "Pendente",
        source: "email",
        createdAt: "2026-06-28T16:30:00Z"
      }
    ]
  };

  fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf-8");
}

initDatabase();

// Database read helper
function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao ler db.json, usando padrão vazio", e);
    return { condos: [], payments: [], expenses: [] };
  }
}

// Database write helper
function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Erro ao escrever em db.json", e);
    return false;
  }
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Condominiums (Condomínios)
app.get("/api/condos", (req, res) => {
  const db = readDB();
  res.json(db.condos);
});

app.post("/api/condos", (req, res) => {
  const db = readDB();
  const newCondo = {
    id: "condo-" + Date.now(),
    name: req.body.name,
    address: req.body.address || "",
    units: req.body.units || [],
    createdAt: new Date().toISOString()
  };
  db.condos.push(newCondo);
  writeDB(db);
  res.status(201).json(newCondo);
});

app.put("/api/condos/:id", (req, res) => {
  const db = readDB();
  const index = db.condos.findIndex((c: any) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Condomínio não encontrado." });
  }

  // Preserve ID and creation
  db.condos[index] = {
    ...db.condos[index],
    name: req.body.name,
    address: req.body.address || "",
    units: req.body.units || []
  };

  // Keep condoName in payments sync'ed if updated
  db.payments.forEach((p: any) => {
    if (p.condoId === req.params.id) {
      p.condoName = req.body.name;
    }
  });

  // Keep condoName in expenses sync'ed if updated
  db.expenses.forEach((e: any) => {
    if (e.condoId === req.params.id) {
      e.condoName = req.body.name;
    }
  });

  writeDB(db);
  res.json(db.condos[index]);
});

app.delete("/api/condos/:id", (req, res) => {
  const db = readDB();
  const index = db.condos.findIndex((c: any) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Condomínio não encontrado." });
  }
  db.condos.splice(index, 1);
  // Also delete related payments & expenses? Let's filter them or keep them.
  // It's safer to delete them or clear their references.
  db.payments = db.payments.filter((p: any) => p.condoId !== req.params.id);
  db.expenses = db.expenses.filter((e: any) => e.condoId !== req.params.id);

  writeDB(db);
  res.json({ success: true, message: "Condomínio excluído com sucesso." });
});

// 2. Payments (Mensalidades das Unidades)
app.get("/api/payments", (req, res) => {
  const db = readDB();
  res.json(db.payments);
});

app.post("/api/payments", (req, res) => {
  const db = readDB();
  const { condoId, month, amount, dueDate } = req.body;
  
  const condo = db.condos.find((c: any) => c.id === condoId);
  if (!condo) {
    return res.status(404).json({ error: "Condomínio não encontrado para gerar mensalidades." });
  }

  const generated: any[] = [];
  condo.units.forEach((unit: any) => {
    // Check if payment already exists for this unit in this month
    const exists = db.payments.find(
      (p: any) => p.condoId === condoId && p.unitNumber === unit.number && p.month === month
    );
    if (!exists) {
      const newPay = {
        id: "pay-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
        condoId: condo.id,
        condoName: condo.name,
        unitNumber: unit.number,
        ownerName: unit.ownerName,
        ownerEmail: unit.ownerEmail,
        month,
        amount: parseFloat(amount) || 0,
        dueDate,
        status: "Pendente",
        notifications: []
      };
      db.payments.push(newPay);
      generated.push(newPay);
    }
  });

  writeDB(db);
  res.status(201).json({ success: true, count: generated.length, data: generated });
});

app.put("/api/payments/:id", (req, res) => {
  const db = readDB();
  const index = db.payments.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Mensalidade não encontrada." });
  }

  db.payments[index] = {
    ...db.payments[index],
    status: req.body.status,
    amount: parseFloat(req.body.amount) || db.payments[index].amount,
    dueDate: req.body.dueDate || db.payments[index].dueDate,
    paidAt: req.body.status === "Pago" ? (req.body.paidAt || new Date().toISOString().split("T")[0]) : undefined
  };

  writeDB(db);
  res.json(db.payments[index]);
});

app.delete("/api/payments/:id", (req, res) => {
  const db = readDB();
  const index = db.payments.findIndex((p: any) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Mensalidade não encontrada." });
  }
  db.payments.splice(index, 1);
  writeDB(db);
  res.json({ success: true });
});

// Trigger Notification and generate message body with Gemini
app.post("/api/payments/:id/notify", async (req, res) => {
  const db = readDB();
  const payment = db.payments.find((p: any) => p.id === req.params.id);
  if (!payment) {
    return res.status(404).json({ error: "Mensalidade não encontrada." });
  }

  const channel = req.body.channel || "email";
  let content = "";

  if (process.env.GEMINI_API_KEY) {
    try {
      // Craft prompt to write a highly professional reminder email/message in Portuguese
      const prompt = `Você é o assistente virtual da administradora de condomínios CondoGesto. 
Escreva uma mensagem de cobrança amigável mas profissional direcionada a um morador.
Dados da cobrança:
- Nome do Morador: ${payment.ownerName}
- Unidade: ${payment.unitNumber}
- Condomínio: ${payment.condoName}
- Mês de Referência: ${payment.month}
- Valor: R$ ${payment.amount.toFixed(2)}
- Data de Vencimento: ${payment.dueDate}
- Canal de Envio: ${channel === "email" ? "E-mail" : "WhatsApp"}
- Situação atual: ${payment.status === "Atrasado" ? "Atrasado (já passou do vencimento)" : "Pendente (vence em breve)"}

Requisitos:
- A mensagem deve ser redigida em Português do Brasil.
- Se for WhatsApp, inclua emojis apropriados e mantenha um tom mais direto e amigável.
- Se for E-mail, use uma estrutura com assunto, saudação e assinatura formal da administradora.
- Seja cortês, claro, e informe que em caso de dúvidas ele pode entrar em contato.
- Não crie links falsos de boletos, apenas mencione que o boleto pode ser obtido no portal CondoGesto ou respondendo à mensagem.
- Retorne APENAS o corpo do e-mail/mensagem final, sem textos explicativos antes ou depois.`;

      const response = await getGeminiClient().models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      content = response.text || "";
    } catch (err: any) {
      console.error("Erro ao usar Gemini para notificação:", err);
      // Fallback message
      content = getDefaultNotification(payment, channel);
    }
  } else {
    content = getDefaultNotification(payment, channel);
  }

  // Create notification record
  const notification = {
    id: "not-" + Date.now(),
    sentAt: new Date().toISOString(),
    channel,
    content: content.trim()
  };

  payment.notifications = payment.notifications || [];
  payment.notifications.push(notification);
  writeDB(db);

  res.json({ success: true, notification });
});

function getDefaultNotification(p: any, channel: string) {
  if (channel === "whatsapp") {
    return `Olá, ${p.ownerName}! 🏢\nLembramos que a taxa condominial da unidade ${p.unitNumber} (${p.condoName}) referente a ${p.month} está ${p.status === "Atrasado" ? "atrasada ⚠️" : "pendente de pagamento"}.\n\n💵 Valor: R$ ${p.amount.toFixed(2)}\n📅 Vencimento: ${p.dueDate}\n\nPor favor, efetue o pagamento ou entre em contato com a administradora se precisar de ajuda!`;
  } else {
    return `Assunto: Lembrete de Pagamento de Condomínio - Unidade ${p.unitNumber}\n\nPrezado(a) ${p.ownerName},\n\nEntramos em contato para lembrar sobre a taxa condominial pendente para a unidade ${p.unitNumber} do ${p.condoName}.\n\nReferência: ${p.month}\nValor: R$ ${p.amount.toFixed(2)}\nVencimento: ${p.dueDate}\nSituação: ${p.status === "Atrasado" ? "Atrasado" : "Pendente"}\n\nSe você já realizou o pagamento, favor desconsiderar este e-mail.\n\nAtenciosamente,\nAdministradora CondoGesto`;
  }
}

// 3. Expenses (Despesas de Reabastecimento)
app.get("/api/expenses", (req, res) => {
  const db = readDB();
  res.json(db.expenses);
});

app.post("/api/expenses", (req, res) => {
  const db = readDB();
  const newExp = {
    id: "exp-" + Date.now(),
    condoId: req.body.condoId || "",
    condoName: req.body.condoName || "Sem Condomínio",
    dueDate: req.body.dueDate || new Date().toISOString().split("T")[0],
    invoiceNumber: req.body.invoiceNumber || "",
    provider: req.body.provider || "",
    description: req.body.description || "",
    amount: parseFloat(req.body.amount) || 0,
    status: req.body.status || "Pendente",
    source: req.body.source || "manual",
    createdAt: new Date().toISOString()
  };
  db.expenses.push(newExp);
  writeDB(db);
  res.status(201).json(newExp);
});

app.put("/api/expenses/:id", (req, res) => {
  const db = readDB();
  const index = db.expenses.findIndex((e: any) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Despesa não encontrada." });
  }

  db.expenses[index] = {
    ...db.expenses[index],
    condoId: req.body.condoId || db.expenses[index].condoId,
    condoName: req.body.condoName || db.expenses[index].condoName,
    dueDate: req.body.dueDate || db.expenses[index].dueDate,
    invoiceNumber: req.body.invoiceNumber || db.expenses[index].invoiceNumber,
    provider: req.body.provider || db.expenses[index].provider,
    description: req.body.description || db.expenses[index].description,
    amount: parseFloat(req.body.amount) !== undefined ? parseFloat(req.body.amount) : db.expenses[index].amount,
    status: req.body.status || db.expenses[index].status
  };

  writeDB(db);
  res.json(db.expenses[index]);
});

app.delete("/api/expenses/:id", (req, res) => {
  const db = readDB();
  const index = db.expenses.findIndex((e: any) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Despesa não encontrada." });
  }
  db.expenses.splice(index, 1);
  writeDB(db);
  res.json({ success: true });
});

// Launch expense into financial system (sets status to "Lancado")
app.post("/api/expenses/:id/launch", (req, res) => {
  const db = readDB();
  const index = db.expenses.findIndex((e: any) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Despesa não encontrada." });
  }
  db.expenses[index].status = "Lancado";
  writeDB(db);
  res.json({ success: true, data: db.expenses[index] });
});

// Parse pasted email text with Gemini
app.post("/api/expenses/parse-email", async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Texto do e-mail é obrigatório." });
  }

  const db = readDB();
  const condoNames = db.condos.map((c: any) => c.name);

  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `Analise o seguinte texto de e-mail recebido sobre uma cobrança ou nota fiscal de condomínio. 
Você deve extrair informações específicas para criar uma despesa de reabastecimento/manutenção.

Disponibilizamos uma lista de condomínios cadastrados no sistema:
${JSON.stringify(condoNames)}

Texto do E-mail:
"${text}"

Instruções importantes:
- Tente identificar qual dos condomínios da lista acima está sendo cobrado. Se corresponder de forma óbvia, use exatamente o nome da lista. Se não, extraia o nome do condomínio conforme mencionado. Se não houver condomínio mencionado, preencha com o mais plausível ou "Sem Condomínio".
- Extraia a data de vencimento do boleto no formato "YYYY-MM-DD". Se não encontrar nenhuma data futura ou explícita de vencimento, adote o dia de hoje (ou uma estimativa lógica).
- Extraia o número da Nota Fiscal (NF) se houver.
- Extraia o nome do Fornecedor (quem está cobrando ou emitindo a nota).
- Crie uma descrição curta e resumida em português do que se trata (ex: "Reabastecimento de gás GLP", "Entrega de material de piscina").
- Extraia o valor total da cobrança em número decimal (R$).

Retorne as informações no formato JSON conforme esquema solicitado.`;

      const response = await getGeminiClient().models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              condoName: { type: Type.STRING, description: "Nome do condomínio correspondente ou extraído" },
              dueDate: { type: Type.STRING, description: "Data de vencimento do boleto no formato YYYY-MM-DD" },
              invoiceNumber: { type: Type.STRING, description: "Número da nota fiscal ou fatura se encontrada" },
              provider: { type: Type.STRING, description: "Nome do fornecedor ou empresa emissora" },
              description: { type: Type.STRING, description: "Descrição resumida do serviço ou produto" },
              amount: { type: Type.NUMBER, description: "Valor em reais" }
            },
            required: ["condoName", "dueDate", "invoiceNumber", "provider", "description", "amount"]
          }
        }
      });

      const resultText = response.text || "{}";
      const parsed = JSON.parse(resultText);

      // Find matched condoId
      const matchedCondo = db.condos.find(
        (c: any) => c.name.toLowerCase().includes(parsed.condoName.toLowerCase()) || 
                    parsed.condoName.toLowerCase().includes(c.name.toLowerCase())
      );

      const responsePayload = {
        condoId: matchedCondo ? matchedCondo.id : "",
        condoName: matchedCondo ? matchedCondo.name : parsed.condoName,
        dueDate: parsed.dueDate || new Date().toISOString().split("T")[0],
        invoiceNumber: parsed.invoiceNumber || "",
        provider: parsed.provider || "",
        description: parsed.description || "Reabastecimento",
        amount: parsed.amount || 0,
        status: "Pendente",
        source: "email"
      };

      return res.json(responsePayload);
    } catch (err: any) {
      console.error("Erro ao usar Gemini para parse de e-mail:", err);
      // Fallback with regex/mock
      return res.json(getFallbackParsedExpense(text, db.condos));
    }
  } else {
    // Return regex fallback if no Gemini Key configured
    return res.json(getFallbackParsedExpense(text, db.condos));
  }
});

// Parse uploaded document (base64 image, PDF or raw text) with Gemini
app.post("/api/expenses/parse-doc", async (req, res) => {
  const { fileData, fileName, mimeType, rawText } = req.body;
  const db = readDB();
  const condoNames = db.condos.map((c: any) => c.name);

  // If we have an actual file (image) base64 data, we can send it to Gemini Multimodal!
  if (process.env.GEMINI_API_KEY && fileData && mimeType) {
    try {
      const base64Data = fileData.split(",")[1] || fileData;
      
      const promptPart = {
        text: `Você é um leitor inteligente de documentos e boletos para a CondoGesto.
Analise a imagem/documento anexado (que é uma Nota Fiscal, Fatura ou Boleto) e extraia:
- Nome do Condomínio favorecido/destinatário. Selecione um dos nossos cadastrados se bater com algum desta lista: ${JSON.stringify(condoNames)}
- Data de vencimento do boleto/fatura (formato YYYY-MM-DD).
- Número da Nota Fiscal (NF) ou Número do Documento.
- Fornecedor / Emissor.
- Descrição da despesa (ex: "Consumo de água", "Reabastecimento de Gás", "Energia elétrica").
- Valor total cobrado em R$ (número).

Retorne os dados estritamente em formato JSON conforme esquema.`
      };

      const filePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };

      const response = await getGeminiClient().models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [filePart, promptPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              condoName: { type: Type.STRING },
              dueDate: { type: Type.STRING },
              invoiceNumber: { type: Type.STRING },
              provider: { type: Type.STRING },
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER }
            },
            required: ["condoName", "dueDate", "invoiceNumber", "provider", "description", "amount"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      
      const matchedCondo = db.condos.find(
        (c: any) => c.name.toLowerCase().includes(parsed.condoName.toLowerCase()) || 
                    parsed.condoName.toLowerCase().includes(c.name.toLowerCase())
      );

      const responsePayload = {
        condoId: matchedCondo ? matchedCondo.id : "",
        condoName: matchedCondo ? matchedCondo.name : parsed.condoName,
        dueDate: parsed.dueDate || new Date().toISOString().split("T")[0],
        invoiceNumber: parsed.invoiceNumber || "",
        provider: parsed.provider || "",
        description: parsed.description || "Processado via documento",
        amount: parsed.amount || 0,
        status: "Pendente",
        source: "documento"
      };

      return res.json(responsePayload);
    } catch (err: any) {
      console.error("Erro ao usar Gemini multimodal para documento:", err);
      // Fallback
      return res.json(getFallbackParsedExpense(rawText || fileName || "Documento", db.condos));
    }
  } else {
    // If text was provided instead of base64 image or no Gemini key
    const textToParse = rawText || `Fatura de ${fileName || "documento"}`;
    return res.json(getFallbackParsedExpense(textToParse, db.condos));
  }
});

// Generic Regex heuristic extraction when Gemini is not available or fails
function getFallbackParsedExpense(text: string, condos: any[]): any {
  const normalizedText = text.toLowerCase();
  
  // Try matching condo name
  let matchedCondo = condos[0] || null;
  for (const condo of condos) {
    if (normalizedText.includes(condo.name.toLowerCase()) || condo.name.toLowerCase().split(" ").some((w: string) => w.length > 4 && normalizedText.includes(w))) {
      matchedCondo = condo;
      break;
    }
  }

  // Try extracting value with regex (R$ 1.250,00 or 1250,00 or 1250.00)
  let amount = 1500.00; // default plausible value
  const valueRegex = /(?:r\$|valor:?\s*r\$|total:?\s*r\$)?\s*(\d{1,3}(?:\.\d{3})*,\d{2}|\d+[\.,]\d{2})/i;
  const matchVal = text.match(valueRegex);
  if (matchVal) {
    const cleanVal = matchVal[1].replace(/\./g, "").replace(",", ".");
    amount = parseFloat(cleanVal) || 1500.00;
  }

  // Try extracting NF (Nota fiscal)
  let invoiceNumber = "";
  const nfRegex = /(?:nf|nota fiscal|nf-e|numero|nº:?)\s*(\d+)/i;
  const matchNf = text.match(nfRegex);
  if (matchNf) {
    invoiceNumber = "NF-" + matchNf[1];
  } else {
    invoiceNumber = "NF-" + Math.floor(10000 + Math.random() * 90000);
  }

  // Try extracting date (vencimento: DD/MM/AAAA or vencimento em DD/MM/AAAA)
  let dueDate = "2026-07-10"; // Default
  const dateRegex = /(?:vencimento|vence|venc|venc\.?|pago até)\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i;
  const matchDate = text.match(dateRegex);
  if (matchDate) {
    const [day, month, year] = matchDate[1].split("/");
    dueDate = `${year}-${month}-${day}`;
  } else {
    // Try ISO format
    const isoRegex = /(\d{4}-\d{2}-\d{2})/;
    const matchIso = text.match(isoRegex);
    if (matchIso) {
      dueDate = matchIso[1];
    }
  }

  // Provider
  let provider = "Fornecedor de Reabastecimento";
  if (normalizedText.includes("ultragaz")) provider = "Ultragaz S/A";
  else if (normalizedText.includes("supergas")) provider = "SuperGás S/A";
  else if (normalizedText.includes("liquigas")) provider = "Liquigás S/A";
  else if (normalizedText.includes("sabesp")) provider = "SABESP";
  else if (normalizedText.includes("enel")) provider = "Enel Distribuição";
  else {
    // Try to find capitalized words as provider
    const words = text.split("\n")[0].split(" ");
    if (words.length > 1) {
      provider = words.slice(0, 3).join(" ").trim();
    }
  }

  return {
    condoId: matchedCondo ? matchedCondo.id : "",
    condoName: matchedCondo ? matchedCondo.name : "Condomínio Não Identificado",
    dueDate,
    invoiceNumber,
    provider,
    description: "Reabastecimento de insumos (Extração heurística)",
    amount,
    status: "Pendente",
    source: "manual"
  };
}

// -------------------------------------------------------------
// Vite and Static File Serving Integration
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
