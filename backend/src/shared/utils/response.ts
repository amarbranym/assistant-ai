import { Response } from "express";

interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export function ok<T>(res: Response, data: T): Response<ApiResponse<T>> {
  return res.status(200).json({ success: true, data });
}

export function created<T>(res: Response, data: T): Response<ApiResponse<T>> {
  return res.status(201).json({ success: true, data });
}

export function noContent(res: Response): Response<ApiResponse<null>> {
  return res.status(204).json({ success: true, data: null });
}

export function error(
  res: Response,
  status: number,
  payload: ApiError
): Response<ApiResponse<null>> {
  return res.status(status).json({
    success: false,
    error: payload
  });
}
