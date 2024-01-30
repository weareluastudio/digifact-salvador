import convertToWords, { toFixed } from "../tools";
import { NUCContext } from "../types";

export const getFacturaCCFData = ({
  now,
  billingSerial,
  subsidiary,
  businessBilling,
  businessInfo,
  customerAddress,
  customerEmail,
  customerName,
  customerNotes,
  customerNRC,
  customerPhone,
  customerTaxId,
  body,
  grandTotal,
}: NUCContext) => {
  return {
    Version: "3",
    CountryCode: "SV",
    Header: {
      DocType: "03",
      IssuedDateTime: now?.toISOString(),
      AdditionalIssueType: "00",
      Currency: "USD",
      AdditionalIssueDocInfo: [
        {
          Name: "Secuencial",
          Data: null,
          Value: billingSerial?.toString().padStart(15, "0"),
        },
        {
          Name: "CodEstPuntoV",
          Data: null,
          Value: `${subsidiary}P001`,
        },
        {
          Name: "TipoModelo",
          Data: null,
          Value: "1",
        },
        {
          Name: "TipoOperacion",
          Data: null,
          Value: "1",
        },
      ],
    },
    Seller: {
      TaxID: businessBilling?.taxId,
      TaxIDAdditionalInfo: [
        {
          Name: "NRC",
          Data: null,
          Value: businessBilling?.nrc,
        },
        {
          Name: "CodigoActividad",
          Data: null,
          Value: businessBilling?.activityCode,
        },
        {
          Name: "DescActividad",
          Data: null,
          Value: businessInfo?.description || "Sin descripción",
        },
      ],
      Name: businessInfo?.name.toUpperCase(),
      Contact: {
        PhoneList: {
          Phone: [
            businessInfo?.phone?.replace("+502", "")?.replace("+503", ""),
          ],
        },
        EmailList: {
          Email: [businessInfo?.users?.[0]],
        },
      },
      AdditionlInfo: [
        {
          Name: "NombreComercial",
          Data: null,
          Value: businessInfo?.name.toUpperCase(),
        },
        {
          Name: "TipoEstablecimiento",
          Data: null,
          Value: "01",
        },
        {
          Name: "CodEstablecimientoMH",
          Data: null,
          Value: subsidiary,
        },
        {
          Name: "CodEstablecimiento",
          Data: null,
          Value: subsidiary,
        },
        {
          Name: "CodPuntoVentaMH",
          Data: null,
          Value: "P001",
        },
        {
          Name: "CodPuntoVenta",
          Data: null,
          Value: "P001",
        },
      ],
      AddressInfo: {
        Address: "direccion de prueba, residencial de prueba",
        District: "14",
        State: "06",
        Country: "SV",
      },
    },
    Buyer: {
      TaxID: customerTaxId,
      Name: customerName?.toUpperCase(),
      TaxIDAdditionalInfo: [
        {
          Name: "NRC",
          Data: null,
          Value: customerNRC,
        },
        {
          Name: "CodigoActividad",
          Data: null,
          Value: "62010",
        },
        {
          Name: "DescActividad",
          Data: null,
          Value: "Programacion Informatica",
        },
      ],
      Contact: {
        PhoneList: {
          Phone: [customerPhone?.replace("+502", "")?.replace("+503", "")],
        },
        EmailList: {
          Email: [customerEmail],
        },
      },
      AdditionlInfo: null,
      AddressInfo: {
        Address: customerAddress,
        District: "14",
        Country: "SV",
        State: "06",
      },
    },
    Items: body?.products?.map((product, productIndex) => ({
      Number: productIndex + 1 + "",
      Codes: [
        {
          Name: "CodTributo",
          Data: null,
          Value: "D4",
        },
      ],
      Type: "4",
      Description: product.title.toUpperCase(),
      Qty: `\${${product.count}.00}`,
      UnitOfMeasure: "99",
      Price: `\${${toFixed(Number(product.price))}}`,
      Discounts: { Discount: [{ Amount: 0.0 }] },
      Taxes: {
        Tax: [
          {
            Code: "20",
            Amount: "0.00",
          },
        ],
      },
      Charges: {
        Charge: [
          {
            Code: "VENTA_GRAVADA",
            Amount: `\${${toFixed(Number(product.totalPrice))}}`,
          },
        ],
      },
      Totals: {
        TotalItem: `\${${toFixed(Number(product.totalPrice))}}`,
      },
      AdditionalInfo: [
        {
          Name: "PrecioSugeridoVenta",
          Data: null,
          Value: "0.00",
        },
      ],
    })),
    Totals: {
      TotalCharges: {
        TotalCharge: [
          {
            Code: "TOTAL_NO_SUJETA",
            Amount: 0.0,
          },
          {
            Code: "TOTAL_EXENTA",
            Amount: 0.0,
          },
          {
            Code: "TOTAL_GRAVADA",
            Amount: `\${${grandTotal}}`,
          },
          {
            Code: "TOTAL_NO_GRAVADO",
            Amount: 0.0,
          },
        ],
      },
      TotalDiscounts: {
        Discount: [
          {
            Code: "NO_SUJETA",
            Amount: 0.0,
          },
          {
            Code: "EXENTA",
            Amount: 0.0,
          },
          {
            Code: "GRAVADA",
            Amount: 0.0,
          },
          {
            Code: "PORCENTAJE_DESCUENTO",
            Amount: 0.0,
          },
        ],
      },
      GrandTotal: { InvoiceTotal: `\${${grandTotal}}` },

      // @ts-ignore
      InWords: convertToWords(grandTotal),
      AdditionalInfo: [
        {
          Name: "IvaRetenido",
          Data: null,
          Value: "0.00",
        },
        {
          Name: "RetencionRenta",
          Data: null,
          Value: "0.00",
        },
        {
          Name: "SaldoFavor",
          Data: null,
          Value: "0.00",
        },
        {
          Name: "CondicionOperacion",
          Data: null,
          Value: "1",
        },
        {
          Name: "NumPagoElectronico",
          Data: null,
          Value: billingSerial?.toString(),
        },
      ],
    },
    Payments: [
      {
        Code: "01",
        Amount: `\${${grandTotal}}`,
      },
    ],
    AdditionalDocumentInfo: {
      AdditionalInfo: [
        {
          AditionalInfo: [
            {
              Name: "NombreEntrega",
              Data: null,
              Value: businessInfo?.name.toUpperCase(),
            },
            {
              Name: "DocuEntrega",
              Data: null,
              Value: businessBilling?.taxId,
            },
            {
              Name: "NombreRecibe",
              Data: null,
              Value: customerName?.toUpperCase(),
            },
            {
              Name: "DocuRecibe",
              Data: null,
              Value: customerTaxId,
            },
            {
              Name: "Observaciones",
              Data: null,
              Value: customerNotes || "Sin observaciones",
            },
          ],
        },
      ],
    },
  } as const;
};
