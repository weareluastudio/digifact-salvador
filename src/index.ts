/* eslint-disable object-curly-spacing */
/* eslint-disable max-len */
/* eslint-disable quote-props */
import cors from "cors";
import dayjs from "dayjs";
import express from "express";
/* eslint-disable @typescript-eslint/ban-ts-comment */
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import fetch from "node-fetch";

import serviceAccount from "./google.json";
import { getFacturaData } from "./nuc/factura";
import DIGIFACT_API_URL, { DIGIFACT_AUTH_URL } from "./utils/constants";
import { Business, CertBody, CompanyBilling } from "./types";
import { getFacturaCCFData } from "./nuc/ccf";
import getNUCData from "./nuc/build";

const frbApp = admin.initializeApp({
  // @ts-ignore
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://facilito-app.firebaseio.com",
});
const app = express();
app.use(cors({ origin: "*" }));

interface DigifactAuth {
  Token: string;
  expira_en: string;
  otorgado_a: string;
}

interface DigifactResp {
  suggestedFileName2: string;
  issuedTimeStamp: string;
  responseData3: string;
  authNumber: string;
  code: number;
}

interface BillingForm extends DigifactResp {
  customerTaxId: string;
  customerName: string;
  storageURL?: string;
  issuedTime: string;
  answerId: number;
  updatedAt: Date;
  dteType: string;
  status: string;
  formId: string;
}

const db = getFirestore(frbApp);
db.settings({ ignoreUndefinedProperties: true });

app.post("/cert", async (req, res) => {
  try {
    const body = req.body as CertBody;

    const exiteWithError = (message: string) => {
      return res.status(500).json({
        error: true,
        message,
      });
    };

    // VALIDATE BODY
    if (!body.businessId) return exiteWithError("BusinessID is Required");
    if (!body.data) return exiteWithError("Data is Required");
    if (!body.dteType) return exiteWithError("DteType is Required");
    if (!body.formId) return exiteWithError("FormId is Required");

    // GET BUSINESS
    const business = db.collection("business").doc(body.businessId);
    const businessData = await business.get();
    const businessInfo = businessData.data() as Business;

    // GET BUSINESS BILLING
    const businessBillingCol = db.collection("billing").doc(body.businessId);
    const businessDoc = await businessBillingCol.get();
    const businessBilling = businessDoc.data() as CompanyBilling;

    // VALIDATE BUSINESS BILLING
    if (!businessBilling?.taxId) return exiteWithError("TaxID not found");
    if (!businessBilling?.password) return exiteWithError("Password not found");
    if (!businessBilling?.username) return exiteWithError("Username not found");

    // GET BUSINESS FORM
    const billingFormCol = db
      .collection("business")
      .doc(body.businessId)
      .collection("billing")
      .doc(body.formId);

    // CREATE IF NOT EXIST
    if (!(await billingFormCol.get()).exists) {
      await billingFormCol.set({
        data: {},
      });
    }

    await billingFormCol.update({
      [`data.${body.answerId}`]: {
        updatedAt: new Date(),
        status: "created",
      } as BillingForm,
    });

    // VERIFY IF TOKEN EXPIRES
    // @ts-ignore
    const expireDate = businessBilling?.tokenExpires?.toDate() as Date;
    const dateDiff = !expireDate || new Date().getTime() > expireDate.getTime();

    let billingSerial = Number(businessBilling?.serialCounter ?? 0);

    // CREATE IF NOT EXIST
    if (!(await businessBillingCol.get()).exists) {
      await businessBillingCol.set({
        serialCounter: billingSerial,
      });
    }
    await businessBillingCol.update({ serialCounter: ++billingSerial });

    if (!businessBilling.tokenExpires || dateDiff) {
      // GET TOKEN FIRST
      console.log({
        Username: `SV.${businessBilling.taxId}.${businessBilling.username}`,
        Password: `${businessBilling.password}`,
      });
      const tokenReq = await fetch(`${DIGIFACT_AUTH_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Username: `SV.${businessBilling.taxId}.${businessBilling.username}`,
          Password: `${businessBilling.password}`,
        }),
      });
      const tokenJSON = (await tokenReq.json()) as DigifactAuth;
      const tokenExpiresDate = dayjs(
        tokenJSON.expira_en,
        "MM/DD/YYYY h:mm:ss A"
      );

      // UPDATE TOKEN
      businessBilling.token = tokenJSON.Token;
      businessBilling.tokenExpires = tokenExpiresDate.toDate();

      await businessBillingCol.update({ ...businessBilling });
    }

    // ERROR ON GENERATE TOKEN
    if (!businessBilling.token) {
      return exiteWithError("Error at generating token");
    }

    // BUILD AUTH
    const urlParams = new URLSearchParams({
      TAXID: businessBilling.taxId,
      FORMAT: "PDF",
      USERNAME: `SV.${businessBilling.taxId}.${businessBilling.username}`,
    });

    // CERT DATA
    const customerName = body.data?.["personal_name_0"]?.answer;
    const customerTaxId = body.data?.["personal_taxId_0"]?.answer;
    const invoiceType = body.data["invoiceType"]?.answer;

    const getFacturaProps = {
      body,
      billingSerial,
      businessInfo,
      businessBilling,
    };
    const finalData = getNUCData({ ...getFacturaProps, invoiceType });

    const bodyJSON = JSON.stringify(finalData, null, 2)?.replace(
      /"\$\{([^}]*)\}"/g,
      (_, group) => group
    );

    const digifactReq = await fetch(
      `${DIGIFACT_API_URL}/v2/transform/nuc_json/?${urlParams.toString()}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: businessBilling.token ?? "",
        },
        body: bodyJSON,
      }
    );

    const digifactJSON = (await digifactReq.json()) as DigifactResp;

    // ON SUCCES
    let digifactError = true;
    if (digifactJSON.code === 1) {
      // NOW UPDATE BILLING
      digifactError = true;

      // CONVERTS TO PDF
      const buffer = Buffer.from(digifactJSON.responseData3, "base64");
      const storageBucket = admin.storage().bucket("facilito-app.appspot.com");

      const file = storageBucket.file(
        `${body.businessId}/billing/${digifactJSON.suggestedFileName2}.pdf`
      );
      await file.save(buffer, {
        contentType: "application/pdf",
        public: true,
      });

      const downloadUrl = await file.getSignedUrl({
        action: "read",
        expires: "03-09-2491",
      });

      await billingFormCol.update({
        [`data.${body.answerId}`]: {
          suggestedFileName2: digifactJSON.suggestedFileName2,
          issuedTime: digifactJSON.issuedTimeStamp,
          customerName: customerName.toUpperCase(),
          authNumber: digifactJSON.authNumber,
          customerTaxId: customerTaxId,
          storageURL: downloadUrl[0],
          answerId: body.answerId,
          code: digifactJSON.code,
          dteType: body.dteType,
          updatedAt: new Date(),
          formId: body.formId,
          status: "cert",
        } as BillingForm,
      });
    }

    return res.status(200).json({
      error: digifactError,
      status: "ok",
      data: {
        ...digifactJSON,
        responseData1: null,
        responseData3: null,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      error: true,
    });
  }
});

interface CancelBody {
  businessId: string;
  answerId: number;
  formId: string;
}

app.post("/cancel", async (req, res) => {
  try {
    const db = getFirestore(frbApp);
    const body = req.body as CancelBody;

    const exitWithError = (message: string) => {
      return res.status(500).json({
        error: true,
        message,
      });
    };

    // VALIDATE BODY
    if (!body.businessId) return exitWithError("BusinessID is Required");
    if (!body.answerId) return exitWithError("AnswerId is Required");
    if (!body.formId) return exitWithError("FormId is Required");

    // GET BUSINESS
    const business = db.collection("business").doc(body.businessId);
    const businessData = await business.get();
    const businessInfo = businessData.data() as Business;

    // GET BUSINESS BILLING
    const businessBillingCol = db.collection("billing").doc(body.businessId);
    const businessDoc = await businessBillingCol.get();
    const businessBilling = businessDoc.data() as CompanyBilling;

    // VALIDATE BUSINESS BILLING
    if (!businessBilling?.taxId) return exitWithError("TaxID not found");
    if (!businessBilling?.password) return exitWithError("Password not found");
    if (!businessBilling?.username) return exitWithError("Username not found");

    // GET BUSINESS FORM
    const billingFormCol = db
      .collection("business")
      .doc(body.businessId)
      .collection("billing")
      .doc(body.formId);

    // GET SERIAL AND CURRENT DATE
    const billingData = (await billingFormCol.get()).data() as {
      data: { [index: number]: BillingForm };
    };

    const answerBilling = billingData?.data?.[Number(body.answerId || 0)];

    await billingFormCol.update({
      [`data.${body.answerId}`]: {
        ...answerBilling,
        updatedAt: new Date(),
        status: "canceled",
      } as BillingForm,
    });

    // VERIFY IF TOKEN EXPIRES
    // @ts-ignore
    const expireDate = businessBilling?.tokenExpires?.toDate() as Date;
    const dateDiff = !expireDate || new Date().getTime() > expireDate.getTime();

    let billingSerial = Number(businessBilling?.serialCounter ?? 0);
    await businessBillingCol.update({ serialCounter: ++billingSerial });

    if (!businessBilling.tokenExpires || dateDiff) {
      // GET TOKEN FIRST
      const tokenReq = await fetch(`${DIGIFACT_AUTH_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Username: `SV.${businessBilling.taxId}.${businessBilling.username}`,
          Password: `${businessBilling.password}`,
        }),
      });
      const tokenJSON = (await tokenReq.json()) as DigifactAuth;
      const tokenExpiresDate = dayjs(
        tokenJSON.expira_en,
        "MM/DD/YYYY h:mm:ss A"
      );

      // UPDATE TOKEN
      businessBilling.token = tokenJSON.Token;
      businessBilling.tokenExpires = tokenExpiresDate.toDate();

      await businessBillingCol.update({ ...businessBilling });
    }

    // ERROR ON GENERATE TOKEN
    if (!businessBilling.token) {
      return exitWithError("Error at generating token");
    }

    // BUILD AUTH
    const urlParams = new URLSearchParams({
      USERNAME: `SV.${businessBilling.taxId}.${businessBilling.username}`,
    });

    if (!answerBilling) return exitWithError("Answer not found");

    const digifactReq = await fetch(
      `${DIGIFACT_API_URL}/CancelFeSV/?${urlParams.toString()}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: businessBilling.token ?? "",
        },
        body: JSON.stringify({
          nit: businessBilling.taxId,
          tipoDte: answerBilling.dteType,
          docGUID: answerBilling.authNumber,
          fechaEmision: answerBilling.issuedTime.split("T")[0],
          nombreEstablecimiento: businessInfo.name.toUpperCase(),
          tipoAnulacion: 2,
          motivoAnulacion: "Petición",
          nombreResponsable: businessInfo.name.toUpperCase(),
          tipoDocumentoResponsable: "36",
          numDocumentoResponsable: businessBilling.taxId,
          nombreSolicitante: answerBilling.customerName,
          tipoDocumentoSolicitante: "36",
          numDocumentoSolicitante: answerBilling.customerTaxId,
        }),
      }
    );

    const digifactJSON = (await digifactReq.json()) as DigifactResp;

    // ON SUCCES
    let digifactError = true;
    if (digifactJSON.code === 1) {
      // NOW UPDATE BILLING
      digifactError = true;

      // CONVERTS TO PDF
      const buffer = Buffer.from(digifactJSON.responseData3, "base64");
      const storageBucket = admin.storage().bucket("facilito-app.appspot.com");

      const file = storageBucket.file(
        `${body.businessId}/billing/${digifactJSON.suggestedFileName2}.pdf`
      );
      await file.save(buffer, {
        contentType: "application/pdf",
        public: true,
      });

      const downloadUrl = await file.getSignedUrl({
        action: "read",
        expires: "03-09-2491",
      });

      await billingFormCol.update({
        [`data.${body.answerId}`]: {
          ...answerBilling,
          storageURL: downloadUrl[0],
        } as BillingForm,
      });
    }

    return res.status(200).json({
      error: digifactError,
      status: "ok",
      data: {
        ...digifactJSON,
        responseData1: null,
        responseData3: null,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      error: true,
    });
  }
});

exports.digifact = onRequest({ maxInstances: 10 }, app);
