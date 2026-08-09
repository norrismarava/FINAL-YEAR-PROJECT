import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listPrescriptions, findPrescriptionById, updatePrescription } from "../repositories/queueRepository.js";

const STOCK_FILE = fileURLToPath(
  new URL("../../data/pharmacy-stock.json", import.meta.url),
);

const DEFAULT_STOCK_ITEMS = [
  { id: "paracetamol-500mg", drugName: "Paracetamol 500mg", inStock: true, lastUpdated: null, notes: "" },
  { id: "amoxicillin-250mg", drugName: "Amoxicillin 250mg", inStock: true, lastUpdated: null, notes: "" },
  { id: "amoxicillin-500mg", drugName: "Amoxicillin 500mg", inStock: true, lastUpdated: null, notes: "" },
  { id: "metformin-500mg", drugName: "Metformin 500mg", inStock: true, lastUpdated: null, notes: "" },
  { id: "atenolol-50mg", drugName: "Atenolol 50mg", inStock: true, lastUpdated: null, notes: "" },
  { id: "ibuprofen-400mg", drugName: "Ibuprofen 400mg", inStock: true, lastUpdated: null, notes: "" },
  { id: "co-trimoxazole-480mg", drugName: "Co-trimoxazole 480mg", inStock: true, lastUpdated: null, notes: "" },
  { id: "art-combination-tld", drugName: "ART Combination (TLD)", inStock: true, lastUpdated: null, notes: "" },
  { id: "rifampicin-450mg", drugName: "Rifampicin 450mg", inStock: true, lastUpdated: null, notes: "" },
  { id: "isoniazid-300mg", drugName: "Isoniazid 300mg", inStock: true, lastUpdated: null, notes: "" },
  { id: "salbutamol-inhaler", drugName: "Salbutamol Inhaler", inStock: true, lastUpdated: null, notes: "" },
  { id: "oral-rehydration-salts", drugName: "Oral Rehydration Salts", inStock: true, lastUpdated: null, notes: "" },
];

let cachedStock = null;

async function ensureDataDir() {
  const dir = path.dirname(STOCK_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function loadStock() {
  if (cachedStock) return cachedStock;
  try {
    const raw = await fs.readFile(STOCK_FILE, "utf8");
    cachedStock = JSON.parse(raw);
  } catch {
    cachedStock = DEFAULT_STOCK_ITEMS.map((item) => ({ ...item }));
  }
  return cachedStock;
}

async function saveStock(stock) {
  cachedStock = stock;
  await ensureDataDir();
  await fs.writeFile(STOCK_FILE, JSON.stringify(stock, null, 2), "utf8");
}

function findStockItemByName(stock, drugName) {
  if (!drugName) return null;
  const normalized = drugName.toLowerCase().trim();
  return stock.find(
    (item) => item.drugName.toLowerCase().trim() === normalized,
  );
}

export async function getStockItems() {
  return loadStock();
}

export async function setStockFlag(drugName, inStock, notes = "") {
  const stock = await loadStock();
  let item = findStockItemByName(stock, drugName);

  if (!item) {
    item = {
      id: crypto.randomUUID(),
      drugName: drugName.trim(),
      inStock,
      lastUpdated: new Date().toISOString(),
      notes: notes.trim(),
    };
    stock.push(item);
  } else {
    item.inStock = inStock;
    item.lastUpdated = new Date().toISOString();
    if (notes !== undefined) item.notes = notes.trim();
  }

  await saveStock(stock);
  return item;
}

export async function addStockItem(drugName, inStock = true, notes = "") {
  const stock = await loadStock();
  const existing = findStockItemByName(stock, drugName);
  if (existing) {
    return { ok: false, error: "Stock item already exists", item: existing };
  }
  const item = {
    id: crypto.randomUUID(),
    drugName: drugName.trim(),
    inStock,
    lastUpdated: new Date().toISOString(),
    notes: notes.trim(),
  };
  stock.push(item);
  await saveStock(stock);
  return { ok: true, item };
}

export async function removeStockItem(id) {
  const stock = await loadStock();
  const idx = stock.findIndex((item) => item.id === id);
  if (idx === -1) return { ok: false, error: "Stock item not found" };
  const removed = stock.splice(idx, 1)[0];
  await saveStock(stock);
  return { ok: true, item: removed };
}

export async function getPrescriptionsWithStockFlags() {
  const [prescriptions, stock] = await Promise.all([
    listPrescriptions(),
    loadStock(),
  ]);

  return prescriptions.map((rx) => {
    const itemsWithFlags = (rx.items ?? []).map((item) => {
      const stockItem = findStockItemByName(stock, item.drugName);
      return {
        ...item,
        inStock: stockItem ? stockItem.inStock : true,
        stockNotes: stockItem?.notes ?? "",
        stockLastUpdated: stockItem?.lastUpdated ?? null,
      };
    });

    const hasOutOfStockItems = itemsWithFlags.some((item) => !item.inStock);
    const outOfStockItems = itemsWithFlags.filter((item) => !item.inStock);

    return {
      ...rx,
      items: itemsWithFlags,
      hasOutOfStockItems,
      outOfStockItems,
    };
  });
}

export async function flagPrescriptionItemOutOfStock(prescriptionId, itemId, inStock, notes = "") {
  const prescription = await findPrescriptionById(prescriptionId);
  if (!prescription) {
    return { ok: false, error: "Prescription not found" };
  }

  const item = (prescription.items ?? []).find((i) => i.id === itemId);
  if (!item) {
    return { ok: false, error: "Prescription item not found" };
  }

  const stockItem = await setStockFlag(item.drugName, inStock, notes);

  const updated = await updatePrescription(prescriptionId, (rx) => ({
    ...rx,
    items: (rx.items ?? []).map((i) =>
      i.id === itemId
        ? {
            ...i,
            inStock,
            stockNotes: notes.trim(),
            stockFlaggedAt: new Date().toISOString(),
          }
        : i,
    ),
    stockFlaggedAt: inStock ? null : new Date().toISOString(),
  }));

  return { ok: true, prescription: updated, stockItem };
}

export async function getStockSummary() {
  const stock = await loadStock();
  const total = stock.length;
  const outOfStock = stock.filter((item) => !item.inStock);
  return {
    total,
    inStockCount: total - outOfStock.length,
    outOfStockCount: outOfStock.length,
    outOfStockItems: outOfStock,
    lastUpdatedAt: new Date().toISOString(),
  };
}
