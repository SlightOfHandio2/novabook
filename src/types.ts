export interface SalesEvent {
  eventType: "SALES";
  date: string;
  invoiceId: string;
  items: SalesItem[];
}

export interface SalesItem {
  itemId: string;
  cost: number;
  taxRate: number;
}

export interface TaxPaymentEvent {
  eventType: "TAX_PAYMENT";
  date: string;
  amount: number;
}

export type TransactionEvent = SalesEvent | TaxPaymentEvent;

export interface SaleAmendment {
  date: string;
  invoiceId: string;
  itemId: string;
  cost: number;
  taxRate: number;
}

export interface TaxPosition {
  date: string;
  taxPosition: number;
}
