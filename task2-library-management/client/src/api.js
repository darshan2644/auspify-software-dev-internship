export const API = "http://localhost:5001/api";
export const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");
export const errMsg = (e) => e.response?.data?.error || "Something went wrong";
