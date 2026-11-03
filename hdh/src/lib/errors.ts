export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly errorKey: string,
    message: string,
    public readonly extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
  toBody() {
    return { error: this.message, errorKey: this.errorKey, ...this.extra };
  }
}

export const err = (status: number, errorKey: string, message: string, extra?: Record<string, unknown>) =>
  new ApiError(status, errorKey, message, extra);
