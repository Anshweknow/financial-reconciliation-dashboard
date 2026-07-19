import { Prisma, ReconciliationStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { fromCents, toCents, withinTolerance } from '../utils/normalize';

const TOLERANCE = 0.02;
export const runReconciliation = async (userId: string) => {
  const [orders, payments] = await Promise.all([prisma.order.findMany({ where: { userId } }), prisma.payment.findMany({ where: { userId } })]);
  const paymentsByOrder = new Map<string, typeof payments>();
  for (const payment of payments) paymentsByOrder.set(payment.normalizedOrderId, [...(paymentsByOrder.get(payment.normalizedOrderId) ?? []), payment]);
  const seenPayments = new Set<string>();
  const results: Prisma.ReconciliationResultCreateManyInput[] = [];
  for (const order of orders) {
    const related = paymentsByOrder.get(order.normalizedOrderId) ?? [];
    const charges = related.filter(p => p.type === 'charge');
    const refunds = related.filter(p => p.type === 'refund');
    related.forEach(p => seenPayments.add(p.id));
    const chargeTotal = charges.reduce((s,p)=>s+toCents(p.amount.toString()),0);
    const refundTotal = refunds.reduce((s,p)=>s+toCents(p.amount.toString()),0);
    const actual = fromCents(chargeTotal - refundTotal);
    const expected = Number(order.netAmount);
    let status: ReconciliationStatus = 'EXACT_MATCH';
    if (!related.length) status = 'MISSING_PAYMENT';
    else if (charges.some(p => p.status === 'failed')) status = 'FAILED_PAYMENT';
    else if (charges.some(p => p.status === 'pending')) status = 'PENDING_PAYMENT';
    else if (refundTotal > 0 && refundTotal < chargeTotal) status = 'PARTIAL_REFUND';
    else if (!withinTolerance(expected, actual, TOLERANCE)) status = 'AMOUNT_MISMATCH';
    results.push({ userId, orderId: order.id, paymentId: related[0]?.id, normalizedOrderId: order.normalizedOrderId, status, expectedAmount: expected, actualAmount: related.length ? actual : null, difference: related.length ? fromCents(toCents(actual) - toCents(expected)) : null, currency: order.currency, details: { paymentCount: related.length, chargeCount: charges.length, refundCount: refunds.length, tolerance: TOLERANCE } });
  }
  for (const payment of payments.filter(p => !seenPayments.has(p.id))) {
    results.push({ userId, paymentId: payment.id, normalizedOrderId: payment.normalizedOrderId, status: 'MISSING_ORDER', expectedAmount: null, actualAmount: Number(payment.amount), difference: Number(payment.amount), currency: payment.currency, details: { transactionRef: payment.transactionRef, tolerance: TOLERANCE } });
  }
  await prisma.reconciliationResult.deleteMany({ where: { userId } });
  if (results.length) await prisma.reconciliationResult.createMany({ data: results });
  return { totalResults: results.length, breakdown: results.reduce<Record<string, number>>((acc,r)=>{ acc[r.status]=(acc[r.status]??0)+1; return acc; }, {}) };
};
export const getResults = (userId: string, status?: ReconciliationStatus, search?: string) => prisma.reconciliationResult.findMany({ where: { userId, ...(status ? { status } : {}), ...(search ? { normalizedOrderId: { contains: search.trim().toUpperCase() } } : {}) }, include: { order: true, payment: true }, orderBy: { createdAt: 'desc' }, take: 500 });
export const getStats = async (userId: string) => {
  const [orders,payments,results] = await Promise.all([prisma.order.findMany({where:{userId}}), prisma.payment.findMany({where:{userId}}), prisma.reconciliationResult.findMany({where:{userId}})]);
  const exact = results.filter(r=>r.status==='EXACT_MATCH');
  const disputed = results.filter(r=>r.status!=='EXACT_MATCH');
  const breakdown = results.reduce<Record<string, number>>((acc,r)=>{ acc[r.status]=(acc[r.status]??0)+1; return acc; }, {});
  const trendMap = new Map<string, { date: string; orders: number; payments: number }>();
  for (const order of orders) { const date = order.orderDate.toISOString().slice(0,10); const row = trendMap.get(date) ?? { date, orders: 0, payments: 0 }; row.orders += 1; trendMap.set(date, row); }
  for (const payment of payments) { const date = (payment.processedAt ?? payment.createdAt).toISOString().slice(0,10); const row = trendMap.get(date) ?? { date, orders: 0, payments: 0 }; row.payments += 1; trendMap.set(date, row); }
  return { totalOrders: orders.length, totalPayments: payments.length, matchedOrders: breakdown.EXACT_MATCH ?? 0, missingOrders: breakdown.MISSING_ORDER ?? 0, missingPayments: breakdown.MISSING_PAYMENT ?? 0, amountMismatches: breakdown.AMOUNT_MISMATCH ?? 0, revenue: payments.filter(p=>p.type==='charge' && p.status==='settled').reduce((s,p)=>s+Number(p.amount),0), refundedAmount: payments.filter(p=>p.type==='refund').reduce((s,p)=>s+Number(p.amount),0), totalValueReconciled: exact.reduce((s,r)=>s+Number(r.expectedAmount ?? 0),0), totalValueInDispute: disputed.reduce((s,r)=>s+Math.abs(Number(r.difference ?? r.expectedAmount ?? r.actualAmount ?? 0)),0), moneyAtRisk: disputed.filter(r=>['MISSING_PAYMENT','MISSING_ORDER','AMOUNT_MISMATCH','FAILED_PAYMENT'].includes(r.status)).reduce((s,r)=>s+Math.abs(Number(r.difference ?? r.expectedAmount ?? r.actualAmount ?? 0)),0), breakdown, trends: [...trendMap.values()].sort((a,b)=>a.date.localeCompare(b.date)) };
};
export const explainResult = async (userId: string, id: string) => {
  const result = await prisma.reconciliationResult.findFirst({ where: { id, userId }, include: { order: true, payment: true } });
  if (!result) return null;
  const impact = Math.abs(Number(result.difference ?? result.expectedAmount ?? result.actualAmount ?? 0));
  const templates: Record<string, string> = { MISSING_PAYMENT: 'No payment transaction was found for this order reference.', MISSING_ORDER: 'A payment references an order that is absent from the imported order ledger.', AMOUNT_MISMATCH: 'The settled payment total differs from the expected order net amount.', PARTIAL_REFUND: 'Refund activity reduced the collected amount for an otherwise matched order.', PENDING_PAYMENT: 'At least one related charge is still pending settlement.', FAILED_PAYMENT: 'At least one related charge failed and should not be treated as collected.', EXACT_MATCH: 'The order and payment data match within the configured tolerance.' };
  return { likelyCause: templates[result.status], businessImpact: impact > 0 ? `Approximately ${result.currency ?? 'USD'} ${impact.toFixed(2)} requires review before close.` : 'No material cash variance is indicated by this result.', suggestedAction: result.status === 'EXACT_MATCH' ? 'No action required beyond routine audit sampling.' : 'Review the source order and payment records, contact the payment processor if needed, and annotate the exception resolution.', confidence: result.status === 'EXACT_MATCH' ? 'High' : 'Medium' };
};
