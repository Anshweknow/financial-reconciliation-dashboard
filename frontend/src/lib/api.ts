import axios from 'axios';
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
export const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use(config => { const token = localStorage.getItem('token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
export type User = { id: string; email: string; createdAt: string };
export type AuthResponse = { user: User; token: string };
export type Result = { id:string; normalizedOrderId:string; status:string; expectedAmount:number|null; actualAmount:number|null; difference:number|null; currency:string|null; createdAt:string; order?:{orderDate:string; status:string; orderId:string}|null; payment?:{status:string; transactionRef:string}|null };
export type Stats = { totalOrders:number; totalPayments:number; totalValueReconciled:number; totalValueInDispute:number; moneyAtRisk:number; refundedAmount:number; revenue:number; matchedOrders:number; missingOrders:number; missingPayments:number; amountMismatches:number; breakdown:Record<string,number>; trends:{date:string; orders:number; payments:number}[] };
export type Explanation = { likelyCause:string; businessImpact:string; suggestedAction:string; confidence:string };
