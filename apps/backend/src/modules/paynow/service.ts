import { AbstractPaymentProvider, MedusaError } from "@medusajs/framework/utils"
import type {
  InitiatePaymentInput,
  InitiatePaymentOutput,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  PaymentSessionStatus,
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/framework/types"
import { createHash } from "node:crypto"

type Options = {
  integrationId: string
  integrationKey: string
  returnUrl: string
  resultUrl: string
}

type PaynowData = {
  reference: string
  session_id?: string
  cart_id?: string
  poll_url?: string
  redirect_url?: string
  status?: string
  payment_method?: string
  currency_code?: string
}

const PAYNOW_INITIATE_URL = "https://www.paynow.co.zw/interface/initiatetransaction"

function hashValues(values: string[], key: string) {
  return createHash("sha512")
    .update(values.join("") + key.toLowerCase())
    .digest("hex")
    .toUpperCase()
}

function verifyHash(values: string[], suppliedHash: string | undefined, key: string) {
  if (!suppliedHash) return false
  return hashValues(values, key) === suppliedHash.toUpperCase()
}

function parsePaynowResponse(raw: string) {
  const params = new URLSearchParams(raw)
  const result: Record<string, string> = {}
  params.forEach((value, key) => {
    result[key.toLowerCase()] = value
  })
  return result
}

class PaynowPaymentProviderService extends AbstractPaymentProvider<Options> {
  protected options_: Options

  constructor(container: any, options: Options) {
    super(container, options)
    this.options_ = options
  }

  static identifier = "paynow"

  static validateOptions(options: Record<string, any>) {
    for (const key of ["integrationId", "integrationKey", "returnUrl", "resultUrl"]) {
      if (!options[key]) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Paynow ${key} is required`)
      }
    }
  }

  private buildReturnUrl(cartId: string) {
    const url = new URL(this.options_.returnUrl)
    url.searchParams.set("paynow", "return")
    url.searchParams.set("cart_id", cartId)
    return url.toString()
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const reference = String(input.data?.session_id || `TI-${input.data?.cart_id || Date.now()}-${Date.now().toString(36)}`)
    const amount = Number(input.amount) / 100
    const currency = String(input.currency_code || "usd").toLowerCase()

    if (currency !== "usd") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Paynow is configured for USD payments.")
    }

    const returnUrl = this.buildReturnUrl(String(input.data?.cart_id || reference))
    const resultUrl = this.options_.resultUrl
    const fields: Record<string, string> = {
      resulturl: resultUrl,
      returnurl: returnUrl,
      reference,
      amount: amount.toFixed(2),
      id: this.options_.integrationId,
      additionalinfo: "Tech Innovation ecommerce order",
      authemail: String(input.data?.email || ""),
      status: "Message",
    }
    const hashFields = Object.keys(fields)
      .filter((key) => key !== "hash")
      .map((key) => encodeURI(fields[key]))
    fields.hash = hashValues(hashFields, this.options_.integrationKey)

    const response = await fetch(PAYNOW_INITIATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields),
    })
    const raw = await response.text()
    if (!response.ok) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Paynow returned HTTP ${response.status}`)
    }

    const data = parsePaynowResponse(raw)
    if (data.status !== "ok" || !data.browserurl || !data.pollurl) {
      throw new MedusaError(MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR, data.error || "Paynow could not initialize the payment.")
    }
    if (!verifyHash([data.status, data.browserurl, data.pollurl], data.hash, this.options_.integrationKey)) {
      throw new MedusaError(MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR, "Paynow returned an invalid response signature.")
    }

    return {
      id: reference,
      data: {
        reference,
        session_id: String(input.data?.session_id || ""),
        cart_id: String(input.data?.cart_id || ""),
        poll_url: data.pollurl,
        redirect_url: data.browserurl,
        status: data.status,
        payment_method: String(input.data?.payment_method || "web"),
        currency_code: currency,
      } satisfies PaynowData,
    }
  }

  private async poll(pollUrl: string) {
    const response = await fetch(pollUrl)
    const raw = await response.text()
    if (!response.ok) throw new Error(`Paynow status request failed with HTTP ${response.status}`)
    return parsePaynowResponse(raw)
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const data = input.data as PaynowData
    if (!data?.poll_url) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Paynow poll URL is missing.")
    }

    const status = await this.poll(data.poll_url)
    const current = String(status.status || "").toLowerCase()

    if (current === "paid") {
      return {
        data: { ...data, status: status.status, paynow_reference: status.paynowreference },
        status: "authorized" as PaymentSessionStatus,
      }
    }

    if (["cancelled", "canceled", "failed", "refunded"].includes(current)) {
      throw new MedusaError(MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR, `Paynow payment status: ${status.status}`)
    }

    return {
      data: { ...data, status: status.status },
      status: "pending" as PaymentSessionStatus,
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return { data: input.data }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    return { data: { ...input.data, refund_amount: input.amount } }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return { data: input.data }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return { data: input.data }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: input.data }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const data = input.data as PaynowData
    if (!data?.poll_url) return { status: "pending" as PaymentSessionStatus }

    try {
      const status = await this.poll(data.poll_url)
      const current = String(status.status || "").toLowerCase()
      if (current === "paid") return { status: "authorized" as PaymentSessionStatus }
      if (["cancelled", "canceled", "failed", "refunded"].includes(current)) {
        return { status: "canceled" as PaymentSessionStatus }
      }
    } catch {
      // Keep the payment pending if Paynow is temporarily unavailable.
    }
    return { status: "pending" as PaymentSessionStatus }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"],
  ): Promise<WebhookActionResult> {
    const data = (payload.data || {}) as Record<string, string>
    const suppliedHash = data.hash || data.Hash
    const valid = verifyHash(
      [data.reference || "", data.amount || "", data.paynowreference || "", data.pollurl || "", data.status || ""],
      suppliedHash,
      this.options_.integrationKey,
    )
    if (!valid) {
      return {
        action: "failed",
        data: { session_id: "", amount: 0 },
      }
    }

    const status = String(data.status || "").toLowerCase()
    const sessionId = data.reference || ""
    const amount = Number(data.amount || 0)

    if (status === "paid") {
      return { action: "authorized", data: { session_id: sessionId, amount } }
    }
    if (["cancelled", "canceled", "failed"].includes(status)) {
      return { action: "failed", data: { session_id: sessionId, amount } }
    }
    return { action: "not_supported", data: { session_id: sessionId, amount } }
  }
}

export default PaynowPaymentProviderService
