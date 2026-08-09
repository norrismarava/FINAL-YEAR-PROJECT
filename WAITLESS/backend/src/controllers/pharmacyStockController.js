import {
  getStockItems,
  setStockFlag,
  addStockItem,
  removeStockItem,
  getPrescriptionsWithStockFlags,
  flagPrescriptionItemOutOfStock,
  getStockSummary,
} from "../services/pharmacyStockService.js";

export async function stockListController() {
  return {
    status: 200,
    body: { items: await getStockItems() },
  };
}

export async function stockSummaryController() {
  return {
    status: 200,
    body: await getStockSummary(),
  };
}

export async function stockFlagController({ body }) {
  const { drugName, inStock, notes } = body ?? {};
  if (!drugName) {
    return { status: 400, body: { message: "drugName is required" } };
  }
  const item = await setStockFlag(drugName, inStock ?? false, notes ?? "");
  return { status: 200, body: { item } };
}

export async function stockAddController({ body }) {
  const { drugName, inStock, notes } = body ?? {};
  if (!drugName) {
    return { status: 400, body: { message: "drugName is required" } };
  }
  const result = await addStockItem(drugName, inStock ?? true, notes ?? "");
  if (!result.ok) {
    return { status: 409, body: { message: result.error, item: result.item } };
  }
  return { status: 201, body: { item: result.item } };
}

export async function stockRemoveController({ params }) {
  const result = await removeStockItem(params.id);
  if (!result.ok) {
    return { status: 404, body: { message: result.error } };
  }
  return { status: 200, body: { item: result.item } };
}

export async function prescriptionsWithStockController() {
  return {
    status: 200,
    body: { prescriptions: await getPrescriptionsWithStockFlags() },
  };
}

export async function flagPrescriptionItemController({ params, body }) {
  const { itemId, inStock, notes } = body ?? {};
  if (!itemId) {
    return { status: 400, body: { message: "itemId is required" } };
  }
  const result = await flagPrescriptionItemOutOfStock(
    params.id,
    itemId,
    inStock ?? false,
    notes ?? "",
  );
  if (!result.ok) {
    return { status: 404, body: { message: result.error } };
  }
  return { status: 200, body: { prescription: result.prescription, stockItem: result.stockItem } };
}
