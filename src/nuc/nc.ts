import convertToWords, { toFixed } from "../tools";
import { NUCContext } from "../types";

export const getNCData = ({
  now,
  billingSerial,
  subsidiary,
  businessBilling,
  businessInfo,
  customerTaxId,
  customerPhone,
  customerEmail,
  customerExport,
  grandTotal,
  body,
  customerActivityCode,
  customerName,
  customerNotes,
  customerNRC,
}: NUCContext) => {
  const totalTaxes = (body?.products?.reduce(
    // @ts-ignore
    (product) => (Number(product.totalPrice) / 1.13) * 0.13
  ) ?? 0) as unknown as number;

  return {
    Version: "3",
    CountryCode: "SV",
    Header: {
      DocType: "05",
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
          Phone: [businessInfo?.phone?.replace("+503", "")],
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
      ],
      AddressInfo: {
        Address: "San Salvador, El Salvador",
        District: "01",
        State: "01",
        Country: "SV",
      },
    },
    Buyer: {
      TaxID: customerTaxId,
      TaxIDType: "36",
      TaxIDAdditionalInfo: [
        {
          Name: "NRC",
          Data: null,
          Value: customerNRC,
        },
        {
          Name: "CodigoActividad",
          Data: null,
          Value: customerActivityCode,
        },
        {
          Name: "DescActividad",
          Data: null,
          Value: "Programacion Informatica",
        },
      ],
      Name: customerName?.toUpperCase(),
      Contact: {
        PhoneList: {
          Phone: [customerPhone?.replace("+503", "")],
        },
        EmailList: {
          Email: [customerEmail],
        },
      },
      AdditionlInfo: [
        {
          Name: "NombreComercial",
          Data: null,
          Value: customerExport?.comertialName,
        },
      ],
    },
    Items: [
      body?.products?.map((product, productIndex) => ({
        Number: productIndex + 1 + "",
        Codes: [
          {
            Name: "NumeroDocumento",
            Data: null,
            Value: "D99104B9-C583-48F3-BE40-93CC69F8E426",
          },
          {
            Name: "Codigo",
            Data: null,
            Value: product.sku.toUpperCase(),
          },
        ],
        Type: "1",
        Description: product.title.toUpperCase(),
        Qty: `\${${product.count}.00}`,
        UnitOfMeasure: "59",
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
        AdditionalInfo: null,
      })),
    ],
    Charges: null,
    Totals: {
      TotalTaxes: {
        TotalTax: [
          {
            Code: "20",
            Description: "Impuesto al Valor Agregado 13%",
            Amount: `${toFixed(totalTaxes)}`,
          },
        ],
      },
      TotalCharges: {
        TotalCharge: [
          {
            Code: "TOTAL_NO_SUJETA",
            Amount: "0.00",
          },
          {
            Code: "TOTAL_EXENTA",
            Amount: "0.00",
          },
          {
            Code: "TOTAL_GRAVADA",
            Amount: `\${${grandTotal}}`,
          },
        ],
      },
      TotalDiscounts: {
        Discount: [
          {
            Code: "NO_SUJETA",
            Amount: "0.00",
          },
          {
            Code: "EXENTA",
            Amount: "0.00",
          },
          {
            Code: "GRAVADA",
            Amount: "10.00",
          },
        ],
      },
      GrandTotal: { InvoiceTotal: `\${${grandTotal}}` },
      // @ts-ignore
      InWords: convertToWords(grandTotal),
      AdditionalInfo: [
        {
          Name: "IvaPercibido",
          Data: null,
          Value: "0.00",
        },
        {
          Name: "IvaRetenido",
          Data: null,
          Value: "0.00",
        },
        {
          Name: "CondicionOperacion",
          Data: null,
          Value: "1",
        },
      ],
    },
    Payments: null,
    AdditionalDocumentInfo: {
      AdditionalInfo: [
        {
          AditionalData: {
            Data: [
              {
                Info: [
                  {
                    Name: "TipoDocumento",
                    Data: null,
                    Value: "03",
                  },
                  {
                    Name: "TipoGeneracion",
                    Data: null,
                    Value: "2",
                  },
                  {
                    Name: "NumDocumento",
                    Data: null,
                    Value: "D99104B9-C583-48F3-BE40-93CC69F8E426",
                  },
                  {
                    Name: "FechaEmision",
                    Data: null,
                    Value: `${now?.getFullYear()}-${
                      (now?.getMonth() ?? 0) + 1 < 10
                        ? `0${(now?.getMonth() ?? 0) + 1}`
                        : (now?.getMonth() ?? 0) + 1
                    }-${now?.getDate()}`,
                  },
                ],
                Name: "DOC_RELACIONADO",
              },
              {
                Info: [
                  {
                    Name: "REFERENCIA_INTERNA",
                    Data: "Etiqueta en la RG",
                    Value: "120-422FFFDF-DXCVVS-ASDA",
                  },
                ],
                Name: "APENDICE",
              },
            ],
          },
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
  };
};
