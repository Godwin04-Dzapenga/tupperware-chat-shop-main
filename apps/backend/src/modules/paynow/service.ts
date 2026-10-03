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
import { Paynow } from "paynow"

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
    const options = this.options_
    const reference = String(
      input.data?.session_id ||
        `TI-${input.data?.cart_id || Date.now()}-${Date.now().toString(36)}`,
    )
    const amount = Number(input.amount) / 100
    const currency = String(input.currency_code || "usd").toLowerCase()

    if (currency !== "usd") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Paynow is configured for USD payments.")
    }

    const email = String(input.data?.email || "").trim()
    if (!email) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "A valid customer email is required for Paynow.")
    }

    const paynow = new Paynow(
      options.integrationId.trim(),
      options.integrationKey.trim(),
      options.resultUrl,
      this.buildReturnUrl(String(input.data?.cart_id || reference)),
    )

    const payment = paynow.createPayment(reference, email)
    payment.add("Tech Innovation ecommerce order", Number(amount.toFixed(2)))

    const response = await paynow.send(payment)
    if (!response?.success) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        String(response?.error || "Paynow could not initialize the payment."),
      )
    }

    if (!response.pollUrl || !response.redirectUrl) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        "Paynow returned an incomplete payment response.",
      )
    }

    return {
      id: reference,
      data: {
        reference,
        session_id: String(input.data?.session_id || ""),
        cart_id: String(input.data?.cart_id || ""),
        poll_url: String(response.pollUrl),
        redirect_url: String(response.redirectUrl),
        status: String(response.status || "Ok"),
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
    if (!suppliedHash) {
      return {
        action: "failed",
        data: { session_id: "", amount: 0 },
      }
    }

    const paynow = new Paynow(
      this.options_.integrationId.trim(),
      this.options_.integrationKey.trim(),
      this.options_.resultUrl,
      this.options_.returnUrl,
    )

    const normalized = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key.toLowerCase(), String(value)]),
    )
    const valid = paynow.verifyHash(normalized)
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
