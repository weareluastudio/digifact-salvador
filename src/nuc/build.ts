import { toFixed } from "../tools";
import { DataProps } from "../types";
import { getFacturaCCFData } from "./ccf";
import { getFacturaData } from "./factura";

const getNUCData = (props: DataProps) => {
  const now = new Date();

  // CERT DATA
  const body = props.body;
  const invoiceType = body.data["invoiceType"]?.answer;
  const customerName = body.data?.["personal_name_0"]?.answer;
  const customerEmail = body.data?.["personal_email_0"]?.answer;
  const customerPhone = body.data?.["personal_phone_0"]?.answer;
  const customerAddress = body.data?.["personal_address_0"]?.answer;
  const customerNotes = body.data?.["personal_instructions_0"]?.answer;
  const customerTaxId = body.data?.["personal_taxId_0"]?.answer;
  const customerNRC = body.data?.["personal_nrc_0"]?.answer;
  const subsidiary = body.data?.["subsidiary"]?.answer;
  const grandTotal = toFixed(
    body.products.reduce((acc, product) => acc + +product.totalPrice, 0)
  );

  const customerData = {
    customerAddress,
    customerEmail,
    customerNRC,
    customerName,
    customerNotes,
    customerPhone,
    customerTaxId,
  };

  const nucContext = {
    ...customerData,
    ...props,
    grandTotal,
    subsidiary,
    now,
  };

  const invoices = {
    Factura: getFacturaData(nucContext),
    "Comprobante de Crédito Fiscal": getFacturaCCFData(nucContext),
  } as const;

  const currentInvoice = invoices[invoiceType as keyof typeof invoices];

  return currentInvoice;
};

export default getNUCData;
