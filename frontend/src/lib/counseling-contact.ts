export const CAMPUS_COUNSELING_CONTACTS = [
  { campus: "Campus Monterrico", email: "orientacionpsicopedagogicamo@upc.pe" },
  { campus: "Campus San Isidro", email: "orientacionpsicopedagogicasi@upc.pe" },
  { campus: "Campus San Miguel", email: "orientacionpsicopedagogicasm@upc.pe" },
  { campus: "Campus Villa", email: "orientacionpsicopedagogicavi@upc.pe" },
] as const;

export const COUNSELING_CONTACT = {
  email: "orientacionpsicopedagogicasm@upc.pe",
  phone: "313-3333",
  crisisLine: "Central telefónica: 313-3333",
  mailto: "mailto:orientacionpsicopedagogicasm@upc.pe?subject=Solicitud%20de%20atención%20-%20MindCare",
  tel: "tel:3133333",
  campusContacts: CAMPUS_COUNSELING_CONTACTS,
};
