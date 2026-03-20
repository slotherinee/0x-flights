export type PaginationInput = {
  page: number
  pageSize: number
}

export type PaginationMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type Paginated<T> = {
  items: T[]
  meta: PaginationMeta
}
