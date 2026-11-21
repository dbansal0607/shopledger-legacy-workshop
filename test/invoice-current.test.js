'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const pricing = require('../lib/pricing');
const invoice = require('../lib/invoice');
const reports = require('../lib/reports');

function item(price, hsn, extra) {
  return Object.assign({
    id: 1,
    sku: 'TEST-001',
    name: 'Test item',
    hsn: hsn,
    price: price,
    qty: 1
  }, extra || {});
}

function order(items, coupon, total) {
  return {
    id: 1001,
    date: '21/11/2026',
    customer: 'In-memory customer',
    paymentMode: 'cash',
    status: 'completed',
    items: items,
    coupon: coupon || '',
    subtotal: items.reduce(function (sum, line) {
      return sum + line.price * line.qty;
    }, 0),
    total: total
  };
}

test('invoice uses the line HSN slab and matches the order tax and total', function () {
  const lines = [item(100, '0405')];
  const ledger = pricing.computeTotals(lines, '');
  const invoiceFigures = invoice.computeInvoiceFigures(order(lines, '', ledger.total));

  assert.equal(ledger.tax, 12);
  assert.equal(ledger.total, 112);
  assert.equal(invoiceFigures.rows[0].gstPercent, 12);
  assert.equal(invoiceFigures.rows[0].lineTax, 12);
  assert.equal(invoiceFigures.tax, 12);
  assert.equal(invoiceFigures.cgst, 6);
  assert.equal(invoiceFigures.sgst, 6);
  assert.equal(invoiceFigures.total, 112);

  const html = invoice.render(order(lines, '', ledger.total));
  assert.match(html, /Invoice Total<\/td><td class="r">₹112\.00/);
  assert.doesNotMatch(html, /differs from Order Ledger recorded total/);
});

test('invoice percent coupon discount and GST match the order pricing', function () {
  const lines = [item(100, '0902')];
  const ledger = pricing.computeTotals(lines, 'WELCOME');
  const invoiceFigures = invoice.computeInvoiceFigures(order(lines, 'WELCOME', ledger.total));

  assert.equal(ledger.discount, 5);
  assert.equal(ledger.tax, 17.1);
  assert.equal(ledger.total, 112.1);
  assert.equal(invoiceFigures.discount, 5);
  assert.equal(invoiceFigures.tax, 17.1);
  assert.equal(invoiceFigures.cgst, 8.55);
  assert.equal(invoiceFigures.sgst, 8.55);
  assert.equal(invoiceFigures.rows[0].lineTax, 17.1);
  assert.equal(invoiceFigures.total, 112.1);
});

test('invoice matches pricing for HSN GST and the SAVE10 maximum discount cap', function () {
  const lines = [item(5000, '0902')];
  const ledger = pricing.computeTotals(lines, 'SAVE10');
  const invoiceFigures = invoice.computeInvoiceFigures(order(lines, 'SAVE10', ledger.total));

  assert.deepEqual({
    subtotal: invoiceFigures.subtotal,
    discount: invoiceFigures.discount,
    tax: invoiceFigures.tax,
    cgst: invoiceFigures.cgst,
    sgst: invoiceFigures.sgst,
    total: invoiceFigures.total
  }, {
    subtotal: ledger.subtotal,
    discount: ledger.discount,
    tax: ledger.tax,
    cgst: ledger.cgst,
    sgst: ledger.sgst,
    total: ledger.total
  });
});

test('invoice does not apply an inactive coupon', function () {
  const lines = [item(1000, '0902')];
  const ledger = pricing.computeTotals(lines, 'DIWALI20');
  const invoiceFigures = invoice.computeInvoiceFigures(order(lines, 'DIWALI20', ledger.total));

  assert.equal(ledger.discount, 0);
  assert.equal(ledger.total, 1180);
  assert.equal(invoiceFigures.discount, 0);
  assert.equal(invoiceFigures.tax, 180);
  assert.equal(invoiceFigures.total, 1180);
});

test('GST reconciliation reports a match when invoice figures match the billed order', function () {
  const lines = [item(100, '0902')];
  const ledger = pricing.computeTotals(lines, 'WELCOME');
  const storedOrder = order(lines, 'WELCOME', ledger.total);
  storedOrder.discount = ledger.discount;
  storedOrder.tax = ledger.tax;
  const report = reports.getGstReconciliation({
    orders: [storedOrder]
  });

  assert.equal(report.mismatchCount, 0);
  assert.equal(report.rows[0].matched, true);
  assert.equal(report.rows[0].delta, 0);
  assert.equal(report.rows[0].ledgerTax, 17.1);
  assert.equal(report.rows[0].invoiceTax, 17.1);
  assert.equal(report.totalDelta, 0);
});
