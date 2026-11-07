/** Enveloppe de succes des reponses du back-end PDREF. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
  metadata?: unknown;
}

/** Reponse paginee serveur du back-end PDREF. */
export interface PagedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
