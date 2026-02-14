import { Router } from "express";

export const PAGINATION_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;
export const PAGINATION_DEFAULT_PAGE_SIZE: number = PAGINATION_PAGE_SIZE_OPTIONS[0];
export const PAGINATION_MAX_PAGE_SIZE = 100;

export const paginationRouter = Router();

paginationRouter.get("/pagination-config", (_req, res) => {
  res.json({
    data: {
      pageSizeOptions: PAGINATION_PAGE_SIZE_OPTIONS,
      defaultPageSize: PAGINATION_DEFAULT_PAGE_SIZE,
      maxPageSize: PAGINATION_MAX_PAGE_SIZE,
    },
  });
});
