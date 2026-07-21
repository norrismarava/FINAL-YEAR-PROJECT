const PROFILE_STORAGE_PREFIX = "waitless_staff_workspace_profile";

export const DEFAULT_STAFF_WORKSPACE_PROFILE = {
  preferredName: "",
  statusMessage: "On shift and keeping live patient flow moving.",
  shiftLabel: "Day shift",
  focusArea: "Queue operations",
  contactExtension: "",
  preferredLandingPage: "",
  availability: "on-shift",
};

const ROLE_LABELS = {
  admin: "Administrator",
  clinician: "Clinician",
  doctor: "Doctor",
  nurse: "Nurse",
  pharmacist: "Pharmacist",
  reception: "Reception",
  receptionist: "Reception",
  radiologist: "Radiologist",
  "lab-tech": "Lab Technician",
  triage: "Triage Officer",
};

const LANDING_PAGE_META = {
  dashboard: {
    label: "Dashboard",
    path: "/admin/dashboard",
    roles: ["admin", "triage", "clinician", "doctor", "nurse"],
  },
  register: {
    label: "Registration desk",
    path: "/admin/register",
    roles: ["admin", "reception", "receptionist"],
  },
  triage: {
    label: "Triage console",
    path: "/admin/triage",
    roles: ["admin", "triage"],
  },
  queue: {
    label: "Queue board",
    path: "/admin/queue",
    roles: ["admin", "triage", "clinician", "doctor", "nurse", "reception", "receptionist"],
  },
  track: {
    label: "Ticket tracker",
    path: "/admin/track",
    roles: ["admin", "triage", "clinician", "doctor", "nurse", "reception", "receptionist"],
  },
};

function profileStorageKey(userId) {
  return `${PROFILE_STORAGE_PREFIX}:${userId}`;
}

export function getStoredStaffWorkspaceProfile(userId) {
  if (typeof window === "undefined" || !userId) {
    return { ...DEFAULT_STAFF_WORKSPACE_PROFILE };
  }

  const raw = window.localStorage.getItem(profileStorageKey(userId));
  if (!raw) {
    return { ...DEFAULT_STAFF_WORKSPACE_PROFILE };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STAFF_WORKSPACE_PROFILE,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_STAFF_WORKSPACE_PROFILE };
  }
}

export function storeStaffWorkspaceProfile(userId, profile) {
  if (typeof window === "undefined" || !userId) {
    return;
  }

  const nextProfile = {
    ...DEFAULT_STAFF_WORKSPACE_PROFILE,
    ...profile,
  };

  window.localStorage.setItem(profileStorageKey(userId), JSON.stringify(nextProfile));
}

export function decorateStaffUser(user) {
  if (!user) {
    return null;
  }

  return {
    ...user,
    workspaceProfile: getStoredStaffWorkspaceProfile(user.id),
  };
}

export function formatStaffRoleLabel(role) {
  return ROLE_LABELS[role] ?? role?.replaceAll("-", " ") ?? "Staff";
}

export function getStaffInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  if (!parts.length) {
    return "WL";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function getAvailableLandingPages(role) {
  return Object.entries(LANDING_PAGE_META)
    .filter(([, entry]) => entry.roles.includes(role) || role === "admin")
    .map(([value, entry]) => ({
      value,
      label: entry.label,
      path: entry.path,
    }));
}

export function resolveStaffLandingPath(user) {
  if (!user) {
    return "/admin/login";
  }

  const preferredLandingPage = user.workspaceProfile?.preferredLandingPage;
  if (preferredLandingPage && LANDING_PAGE_META[preferredLandingPage]) {
    const preferred = LANDING_PAGE_META[preferredLandingPage];
    if (preferred.roles.includes(user.role) || user.role === "admin") {
      return preferred.path;
    }
  }

  if (user.role === "reception" || user.role === "receptionist") {
    return "/admin/register";
  }

  if (user.role === "triage") {
    return "/admin/triage";
  }

  return "/admin/dashboard";
}
