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
  const [totalOrders,totalPayments,results] = await Promise.all([prisma.order.count({where:{userId}}), prisma.payment.count({where:{userId}}), prisma.reconciliationResult.findMany({where:{userId}})]);
  const exact = results.filter(r=>r.status==='EXACT_MATCH');
  const disputed = results.filter(r=>r.status!=='EXACT_MATCH');
  return { totalOrders, totalPayments, totalValueReconciled: exact.reduce((s,r)=>s+Number(r.expectedAmount ?? 0),0), totalValueInDispute: disputed.reduce((s,r)=>s+Math.abs(Number(r.difference ?? r.expectedAmount ?? r.actualAmount ?? 0)),0), moneyAtRisk: disputed.filter(r=>['MISSING_PAYMENT','MISSING_ORDER','AMOUNT_MISMATCH','FAILED_PAYMENT'].includes(r.status)).reduce((s,r)=>s+Math.abs(Number(r.difference ?? r.expectedAmount ?? r.actualAmount ?? 0)),0), breakdown: results.reduce<Record<string, number>>((acc,r)=>{ acc[r.status]=(acc[r.status]??0)+1; return acc; }, {}) };
};
