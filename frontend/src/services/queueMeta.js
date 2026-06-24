export const PRIORITY_META = {
  red: {
    label: "Priority I - Critical",
    short: "Red",
    description: "Respiratory arrest, severe burns, life-threatening cases",
    destination: "Casualty Resuscitation Room",
  },
  yellow: {
    label: "Priority II - Serious",
    short: "Yellow",
    description: "Seriously ill, but not immediately life-threatening",
    destination: "Casualty Observation Ward",
  },
  green: {
    label: "Priority III - Ambulant",
    short: "Green",
    description: "Minor injuries and stable walking patients",
    destination: "Casualty Waiting Area",
  },
  black: {
    label: "Priority IV - Deceased",
    short: "Black",
    description: "Awaiting mortuary transfer",
    destination: "Holding Bay",
  },
};

export const DEPARTMENTS = [
  "OPD",
  "Casualty / Triage",
  "Pharmacy",
  "Laboratory",
  "Radiology",
  "OI Clinic",
];

export function priorityRank(priority) {
  return { red: 0, yellow: 1, green: 2, black: 3 }[priority];
}

export const priorityChipClass = {
  red: "bg-priority-red text-priority-red-foreground",
  yellow: "bg-priority-yellow text-priority-yellow-foreground",
  green: "bg-priority-green text-priority-green-foreground",
  black: "bg-priority-black text-priority-black-foreground",
};

export const STATUS_META = {
  waiting: {
    label: "Waiting",
    className: "bg-muted text-muted-foreground",
  },
  called: {
    label: "Called",
    className: "bg-accent/15 text-accent",
  },
  "in-service": {
    label: "In service",
    className: "bg-primary text-primary-foreground",
  },
  completed: {
    label: "Completed",
    className: "bg-priority-green/15 text-priority-green",
  },
};
