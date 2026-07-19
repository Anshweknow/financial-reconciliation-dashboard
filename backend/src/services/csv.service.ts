import csv from 'csv-parser';
import { Readable } from 'stream';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { normalizeOrderId } from '../utils/normalize';

const money = z.coerce.number().finite();
const orderSchema = z.object({ order_id:z.string().min(1), order_date:z.string().min(1), customer_email:z.string().trim().email().optional().or(z.literal('')), currency:z.string().trim().length(3), gross_amount:money, discount:z.union([money,z.literal('')]).transform(v=>v===''?0:v), net_amount:money, status:z.enum(['completed','cancelled','refunded']) });
const paymentSchema = z.object({ transaction_ref:z.string().min(1), processed_at:z.string().optional(), order_reference:z.string().min(1), currency:z.string().trim().length(3), amount:money, fee:money, net_settled:money, type:z.enum(['charge','refund']), status:z.enum(['settled','pending','failed']) });
const parseDate = (value?: string): Date | null => { if (!value?.trim()) return null; const [d,t='00:00'] = value.trim().split(' '); if (d.includes('/')) { const [day,month,year]=d.split('/'); return new Date(`${year}-${month}-${day}T${t}:00Z`); } return new Date(value); };
const rowsFromBuffer = (buffer: Buffer) => new Promise<Record<string,string>[]>((resolve, reject) => { const rows: Record<string,string>[] = []; Readable.from(buffer).pipe(csv()).on('data', r => rows.push(r)).on('end', () => resolve(rows)).on('error', reject); });
export const importOrders = async (userId: string, buffer: Buffer) => {
  const rows = await rowsFromBuffer(buffer); const parsed = rows.map((r, i) => ({ row: i + 2, data: orderSchema.parse(r) }));
  await prisma.order.deleteMany({ where: { userId } });
  await prisma.order.createMany({ data: parsed.map(({data}) => ({ userId, orderId: data.order_id.trim(), normalizedOrderId: normalizeOrderId(data.order_id), orderDate: new Date(data.order_date), customerEmail: data.customer_email || null, currency: data.currency.trim().toUpperCase(), grossAmount: data.gross_amount, discount: data.discount, netAmount: data.net_amount, status: data.status })), skipDuplicates: true });
  return { imported: parsed.length };
};
export const importPayments = async (userId: string, buffer: Buffer) => {
  const rows = await rowsFromBuffer(buffer); const parsed = rows.map((r, i) => ({ row: i + 2, data: paymentSchema.parse(r) }));
  await prisma.payment.deleteMany({ where: { userId } });
  await prisma.payment.createMany({ data: parsed.map(({data}) => ({ userId, transactionRef: data.transaction_ref.trim(), processedAt: parseDate(data.processed_at), orderReference: data.order_reference.trim(), normalizedOrderId: normalizeOrderId(data.order_reference), currency: data.currency.trim().toUpperCase(), amount: data.amount, fee: data.fee, netSettled: data.net_settled, type: data.type, status: data.status })), skipDuplicates: true });
  return { imported: parsed.length };
};
