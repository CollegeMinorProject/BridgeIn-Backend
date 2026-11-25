export class ApiResponse<T> {
  readonly success: boolean;

  constructor(
    readonly statusCode: number,
    readonly data: T,
    readonly message = "Success",
  ) {
    this.success = statusCode < 400;
  }
}
