export interface Business {
  backgroundImage?: string;
  description?: string;
  background?: string;
  category: string;
  lang: "es" | "en";
  picture?: string;
  users?: string[];
  phone: string;
  badge: string;
  name: string;
  url: string;
  id: string;
}

export interface BillingSubsidiary {
  code: string;
  id: number;
  name: string;
}

export interface CompanyBilling {
  taxId?: string;
  token?: string;
  nrc?: string;
  activityCode?: string;
  username?: string;
  password?: string;
  tokenExpires?: Date;
  serialCounter?: number;
  subsidiary?: Record<number, BillingSubsidiary>;
}

export interface ExtraOptional {
  name: string;
  price: number;
}

export interface ExtraVariable extends ExtraOptional {
  count: number;
}

export interface FormProductSliderAnswer {
  selectedVariableExtraIndex: number;
  stockOption: "lim" | "ctn" | "inf";
  variableExtras: ExtraVariable[];
  productCount: number;
  isVariable: boolean;
  totalPrice: number;
  category: string;
  picture: string;
  count: number;
  price: number;
  title: string;
  sku: string;
}

export interface ParsedProduct extends FormProductSliderAnswer {
  discount: number;
}

export interface FormAnswerItem {
  [index: string]: string;
  answer: string;
  quest: string;
}

export interface FormAnswerItemContainer {
  [index: string]: FormAnswerItem;
}

export interface CertBody {
  data: FormAnswerItemContainer;
  products: ParsedProduct[];
  businessId: string;
  answerId: number;
  dteType: string;
  formId: string;
}

export interface DataProps {
  body: CertBody;
  billingSerial?: number;
  businessInfo: Business;
  businessBilling: CompanyBilling;
  invoiceType: string;
}

export interface ExportCustomer {
  comertialName: string;
  countryCode: string;
  countryName: string;
  complement: string;
  flete: string;
  seguro: string;
}

export interface NUCProps {
  now: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerNotes: string;
  customerTaxId: string;
  customerExport?: ExportCustomer;
  customerNRC: string;
  customerActivityCode?: string;
  subsidiary: string;
  grandTotal: string;
}

export type NUCContext = Partial<NUCProps> & Partial<DataProps>;
