import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";

const HOSPITALS_FILE = fileURLToPath(
  new URL("../../data/hospitals.json", import.meta.url),
);

let cachedHospitals = null;

async function loadHospitals() {
  if (cachedHospitals) return cachedHospitals;
  try {
    const raw = await fs.readFile(HOSPITALS_FILE, "utf8");
    cachedHospitals = JSON.parse(raw);
  } catch {
    cachedHospitals = [
      {
        id: env.hospitalId,
        name: env.hospitalName,
        location: env.hospitalLocation,
        active: true,
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
    ];
    await saveHospitals(cachedHospitals);
  }
  return cachedHospitals;
}

async function saveHospitals(hospitals) {
  cachedHospitals = hospitals;
  const dir = path.dirname(HOSPITALS_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
  await fs.writeFile(HOSPITALS_FILE, JSON.stringify(hospitals, null, 2), "utf8");
}

export async function getHospitals() {
  return loadHospitals();
}

export async function getHospitalById(id) {
  const hospitals = await loadHospitals();
  return hospitals.find((h) => h.id === id) ?? null;
}

export async function getDefaultHospital() {
  const hospitals = await loadHospitals();
  return hospitals.find((h) => h.isDefault) ?? hospitals[0] ?? null;
}

export async function createHospital(data, staff) {
  if (!data?.name?.trim()) {
    return { ok: false, error: "Hospital name is required" };
  }
  const id = data.id?.trim() || data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!id) {
    return { ok: false, error: "Invalid hospital ID" };
  }
  const hospitals = await loadHospitals();
  if (hospitals.find((h) => h.id === id)) {
    return { ok: false, error: "Hospital ID already exists" };
  }
  const hospital = {
    id,
    name: data.name.trim(),
    location: data.location?.trim() ?? "",
    active: true,
    isDefault: false,
    createdAt: new Date().toISOString(),
    createdBy: staff ? { id: staff.id, name: staff.name } : null,
  };
  hospitals.push(hospital);
  await saveHospitals(hospitals);
  return { ok: true, hospital };
}

export async function updateHospital(id, data, staff) {
  const hospitals = await loadHospitals();
  const hospital = hospitals.find((h) => h.id === id);
  if (!hospital) {
    return { ok: false, error: "Hospital not found" };
  }
  if (data.name !== undefined) hospital.name = data.name.trim();
  if (data.location !== undefined) hospital.location = data.location.trim();
  if (data.active !== undefined) hospital.active = Boolean(data.active);
  hospital.updatedAt = new Date().toISOString();
  hospital.updatedBy = staff ? { id: staff.id, name: staff.name } : null;
  await saveHospitals(hospitals);
  return { ok: true, hospital };
}

export async function getHospitalInfo() {
  const hospitals = await loadHospitals();
  const current = hospitals.find((h) => h.id === env.hospitalId) ?? hospitals[0];
  return {
    current: current
      ? {
          id: current.id,
          name: current.name,
          location: current.location,
          active: current.active,
        }
      : {
          id: env.hospitalId,
          name: env.hospitalName,
          location: env.hospitalLocation,
          active: true,
        },
    multiTenant: env.multiTenant,
    allHospitals: env.multiTenant
      ? hospitals.filter((h) => h.active).map((h) => ({
          id: h.id,
          name: h.name,
          location: h.location,
        }))
      : undefined,
  };
}
