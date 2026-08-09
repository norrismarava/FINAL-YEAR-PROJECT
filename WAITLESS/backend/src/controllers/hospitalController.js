import {
  getHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  getHospitalInfo,
} from "../services/hospitalService.js";

export async function hospitalInfoController() {
  const info = await getHospitalInfo();
  return { status: 200, body: info };
}

export async function hospitalListController() {
  const hospitals = await getHospitals();
  return { status: 200, body: { hospitals } };
}

export async function hospitalDetailController({ params }) {
  const hospital = await getHospitalById(params.id);
  if (!hospital) {
    return { status: 404, body: { message: "Hospital not found" } };
  }
  return { status: 200, body: { hospital } };
}

export async function hospitalCreateController({ body, staff }) {
  const result = await createHospital(body, staff);
  if (!result.ok) {
    return { status: 400, body: { message: result.error } };
  }
  return { status: 201, body: { hospital: result.hospital } };
}

export async function hospitalUpdateController({ params, body, staff }) {
  const result = await updateHospital(params.id, body, staff);
  if (!result.ok) {
    return { status: 400, body: { message: result.error } };
  }
  return { status: 200, body: { hospital: result.hospital } };
}
