import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
} from "./index";

/**
 * DataTable Component
 *
 * Props:
 * - columns: [{ header: string, accessor: string, render?: (row) => ReactNode }]
 * - data: array of objects
 * - caption?: string
 * - emptyMessage?: string
 * - loading?: boolean
 * - error?: string
 * - pageSize?: number (default 10)
 */
export default function DataTable({
  columns,
  data = [],
  caption,
  emptyMessage = "No data available.",
  loading = false,
  error = null,
  pageSize = 10,
}) {
  const [page, setPage] = useState(1);

  // Pagination logic
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const currentPageData = data.slice(startIndex, startIndex + pageSize);

  const goToPrevPage = () => setPage((p) => Math.max(p - 1, 1));
  const goToNextPage = () => setPage((p) => Math.min(p + 1, totalPages));

  return (
    <div className="w-full bg-white shadow-md rounded-xl overflow-hidden border border-gray-100">
      <div className="p-4">
        {/* Custom caption above table */}
        {caption && (
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            {caption}
          </h2>
        )}

        <Table className="w-full border-collapse">
          {/* Table Header */}
          <TableHeader className="">
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead
                  key={idx}
                  className="px-4 py-3 text-left text-sm roboto-bold text-gray-700 uppercase tracking-wider"
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody>
            {loading ? (
              // Loading Skeleton Rows
              [...Array(pageSize)].map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex} className="px-4 py-3">
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-red-600 font-medium p-6"
                >
                  {error}
                </TableCell>
              </TableRow>
            ) : currentPageData.length > 0 ? (
              currentPageData.map((row, rowIndex) => (
                <TableRow
                  key={row.$id || row.id || rowIndex}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {columns.map((col, colIndex) => (
                    <TableCell key={colIndex} className="px-4 py-3 text-sm roboto-regular">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-gray-500 italic p-6"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {!loading && !error && totalItems > 0 && (
        <div className="flex items-center justify-between bg-gray-50 border-t px-4 py-3 text-sm rounded-b-xl">
          <div className="text-gray-600">
            Showing{" "}
            <span className="font-semibold text-gray-800">
              {startIndex + 1}-{Math.min(startIndex + pageSize, totalItems)}
            </span>{" "}
            of <span className="font-semibold text-gray-800">{totalItems}</span>{" "}
            results
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page === 1}
              onClick={goToPrevPage}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page === totalPages}
              onClick={goToNextPage}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
