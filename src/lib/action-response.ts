/**
 * Standard response type for server actions
 * Enables consistent success/error handling with toast messages
 */
export type ActionResponse<T = void> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

/**
 * Helper function to create a success response
 * @param message - Success message to display in toast
 * @param data - Optional data to return
 */
export function successResponse<T = void>(
  message: string,
  data?: T
): ActionResponse<T> {
  return { success: true, message, data };
}

/**
 * Helper function to create an error response
 * @param error - Error message to display in toast
 */
export function errorResponse(error: string): ActionResponse {
  return { success: false, error };
}
