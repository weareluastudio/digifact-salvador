import convertToWords, { toFixed } from "../tools";
import { NUCContext } from "../types";

export const getFexData = ({
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
  customerName,
}: NUCContext) => {
  return {
    Version: "1",
    CountryCode: "SV",
    Header: {
      DocType: "11",
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
        {
          Name: "TipoItemExpor",
          Data: null,
          Value: "1",
        },
        {
          Name: "RecintoFiscal",
          Data: null,
          Value: "01",
        },
        {
          Name: "Regimen",
          Data: null,
          Value: "EX1.1000.000",
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
          Name: "DescActividad",
          Data: null,
          Value: "Programacion Informatica",
        },
        {
          Name: "TipoPersona",
          Data: null,
          Value: "1",
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
        {
          Name: "CodPais",
          Data: null,
          Value: customerExport?.countryCode,
        },
        {
          Name: "NombrePais",
          Data: null,
          Value: customerExport?.countryName,
        },
        {
          Name: "Complemento",
          Data: null,
          Value: customerExport?.complement,
        },
      ],
    },
    Items: [
      body?.products?.map((product, productIndex) => ({
        Number: productIndex + 1 + "",
        Codes: [
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
              Code: "C3",
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
            {
              Code: "NO_GRAVADO",
              Amount: 0.0,
            },
          ],
        },
        Totals: {
          TotalItem: `\${${toFixed(Number(product.totalPrice))}}`,
        },
      })),
    ],
    Totals: {
      TotalCharges: {
        TotalCharge: [
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
            Code: "DESCUENTO",
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
          Name: "Seguro",
          Data: null,
          Value: `\${${toFixed(Number(customerExport?.seguro))}}`,
        },
        {
          Name: "Flete",
          Data: null,
          Value: `\${${toFixed(Number(customerExport?.flete))}}`,
        },
        {
          Name: "CondicionOperacion",
          Data: null,
          Value: "1",
        },
        {
          Name: "CodIncoterms",
          Data: null,
          Value: "01",
        },
        {
          Name: "DescIncoterms",
          Data: null,
          Value: "EXW-En fabrica",
        },
        {
          Name: "Observaciones",
          Data: null,
          Value: customerExport?.complement,
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
          AditionalData: {
            Data: [
              {
                Info: [
                  {
                    Name: "CodigoDocAsociado",
                    Data: null,
                    Value: "4",
                  },
                  {
                    Name: "PlacaTransporte",
                    Data: null,
                    Value: "P01234",
                  },
                  {
                    Name: "ModoTransporte",
                    Data: null,
                    Value: "1",
                  },
                  {
                    Name: "NumeroConductor",
                    Data: null,
                    Value: "3740617490502",
                  },
                  {
                    Name: "NombreConductor",
                    Data: null,
                    Value: "Sebastian Vettel",
                  },
                ],
                Name: "OTROS_DOC_RELACIONADOS",
              },
              {
                Info: [
                  {
                    Name: "REFERENCIA_INTERNA",
                    Data: "Etiqueta en la RG",
                    Value: "120-422FFFDF-DXCVVS-ASDA",
                  },
                  {
                    Name: "REFERENCIA_INTERNA_2",
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
              Name: "NitTercero",
              Data: null,
              Value: "06141811710015",
            },
            {
              Name: "NombreTercero",
              Data: null,
              Value: "Pollo Campero de El Salvador, S.A.",
            },
          ],
        },
      ],
    },
  };
};
