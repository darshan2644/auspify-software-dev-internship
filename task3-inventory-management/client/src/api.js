export const API = "http://localhost:5002/api";
export const fmt = (d) => (d ? new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "-");
export const money = (n) => "Rs " + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
export const errMsg = (e) => e.response?.data?.error || "Something went wrong";
