import React, { useState, useEffect, useCallback } from "react";

import API from "../api/client";

import Badge from "../components/Badge";

import Modal from "../components/Modal";

import LoadingSpinner from "../components/LoadingSpinner";

import ProductForm from "./ProductForm";

import Pagination from "../components/Pagination";

import { useToast } from "../components/Toast";

import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  ArrowUpRight,
} from "lucide-react";

import ConfirmDialog from "../components/ConfirmDialog";

import { parseApiError } from "../api/errors";

const PAGE_SIZE = 8;

export default function Products() {
  const showToast = useToast();

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);

  const [editProduct, setEditProduct] = useState(null);

  const [search, setSearch] = useState("");

  const [stockFilter, setStockFilter] = useState("all");

  const [page, setPage] = useState(1);

  const [confirmTarget, setConfirmTarget] = useState(null);

  const fetchProducts = useCallback(() => {
    setLoading(true);

    API.get("/products")

      .then((r) => setProducts(r.data))

      .catch((err) => {
        console.error(err);

        showToast(parseApiError(err, "Failed to load products"), "error");
      })

      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (p) => {
    try {
      await API.delete(`/products/${p.id}`);

      showToast("Product deleted");

      setConfirmTarget(null);

      fetchProducts();
    } catch (err) {
      showToast(parseApiError(err, "Failed to delete"), "error");
    }
  };

  const inStock = products.filter((p) => p.quantity >= 10);

  const lowStock = products.filter((p) => p.quantity > 0 && p.quantity < 10);

  const outStock = products.filter((p) => p.quantity === 0);

  const totalValue = products.reduce(
    (s, p) => s + parseFloat(p.price) * p.quantity,

    0,
  );

  const fmt = (n) =>
    n.toLocaleString("en-IN", {
      style: "currency",

      currency: "INR",
    });

  const TABS = [
    {
      key: "all",

      label: "All",

      count: products.length,
    },

    {
      key: "in",

      label: "In Stock",

      count: inStock.length,
    },

    {
      key: "low",

      label: "Low Stock",

      count: lowStock.length,
    },

    {
      key: "out",

      label: "Out of Stock",

      count: outStock.length,
    },
  ];

  const SUMMARY_CARDS = [
    {
      label: "Total Products",

      count: products.length,

      sub: `${fmt(totalValue)} inventory value`,

      color: "#818cf8",

      bg: "rgba(99,102,241,0.1)",

      border: "rgba(99,102,241,0.25)",
    },

    {
      label: "In Stock",

      count: inStock.length,

      sub: `${fmt(
        inStock.reduce(
          (s, p) => s + parseFloat(p.price) * p.quantity,

          0,
        ),
      )} value`,

      color: "#34d399",

      bg: "rgba(52,211,153,0.1)",

      border: "rgba(52,211,153,0.25)",

      filter: "in",
    },

    {
      label: "Low Stock",

      count: lowStock.length,

      sub: lowStock.length > 0 ? "Needs restock soon" : "All good",

      color: "#fbbf24",

      bg: "rgba(251,191,36,0.1)",

      border: "rgba(251,191,36,0.25)",

      filter: "low",
    },

    {
      label: "Out of Stock",

      count: outStock.length,

      sub: outStock.length > 0 ? "Needs restocking" : "None out of stock",

      color: "#f87171",

      bg: "rgba(248,113,113,0.1)",

      border: "rgba(248,113,113,0.25)",

      filter: "out",
    },
  ];

  const filtered = products

    .filter((p) => {
      if (stockFilter === "in") return p.quantity >= 10;

      if (stockFilter === "low") return p.quantity > 0 && p.quantity < 10;

      if (stockFilter === "out") return p.quantity === 0;

      return true;
    })

    .filter(
      (p) =>
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()),
    );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,

    page * PAGE_SIZE,
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5 max-w-7xl animate-fade-in-up">
      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{ color: "var(--text-1)" }}
            >
              Products
            </h2>

            <span
              className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: "rgba(99,102,241,0.1)",

                color: "#818cf8",
              }}
            >
              Inventory
            </span>
          </div>

          <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
            Manage your product catalog and stock levels
          </p>
        </div>

        <button
          onClick={() => {
            setEditProduct(null);

            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg active:scale-95"
          style={{
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",

            boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
          }}
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Summary cards */}

      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 animate-fade-in-up"
        style={{ animationDelay: "50ms" }}
      >
        {SUMMARY_CARDS.map((c) => (
          <div
            key={c.label}
            onClick={() => {
              if (c.filter) {
                setStockFilter(stockFilter === c.filter ? "all" : c.filter);

                setPage(1);
              }
            }}
            className={`relative overflow-hidden shimmer-card rounded-2xl px-5 py-4 card-hover transition-all ${
              c.filter ? "cursor-pointer" : "cursor-default"
            }`}
            style={{
              background: c.bg,

              border: `1px solid ${
                stockFilter === c.filter ? c.color : c.border
              }`,

              boxShadow:
                stockFilter === c.filter ? `0 0 0 1px ${c.color}` : "none",
            }}
          >
            <div
              className="absolute -right-5 -top-5 w-20 h-20 rounded-full opacity-10"
              style={{ background: c.color }}
            />

            <div className="relative">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: c.color }}
                  />

                  <span
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: c.color }}
                  >
                    {c.label}
                  </span>
                </div>

                {c.filter && (
                  <ArrowUpRight size={14} style={{ color: c.color }} />
                )}
              </div>

              <p
                className="text-2xl font-extrabold"
                style={{ color: "var(--text-1)" }}
              >
                {c.count}
              </p>

              <p
                className="text-xs font-medium mt-1 truncate"
                style={{ color: c.color }}
              >
                {c.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs + Search */}

      <div
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 animate-fade-in-up"
        style={{ animationDelay: "100ms" }}
      >
        <div
          className="flex gap-1 p-1 rounded-xl overflow-x-auto"
          style={{ background: "var(--surface-2)" }}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setStockFilter(t.key);

                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
              style={{
                background:
                  stockFilter === t.key ? "var(--surface)" : "transparent",

                color:
                  stockFilter === t.key ? "var(--text-1)" : "var(--text-3)",

                boxShadow:
                  stockFilter === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {t.label}

              <span
                className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  background:
                    stockFilter === t.key
                      ? "rgba(99,102,241,0.15)"
                      : "rgba(0,0,0,0.06)",

                  color: stockFilter === t.key ? "#818cf8" : "var(--text-3)",
                }}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search
            size={15}
            className="absolute left-3.5 top-3"
            style={{ color: "var(--text-3)" }}
          />

          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);

              setPage(1);
            }}
            className="theme-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
          />
        </div>
      </div>

      {/* Results information */}

      <div
        className="flex items-center justify-between text-xs px-1"
        style={{ color: "var(--text-3)" }}
      >
        <span>
          Showing{" "}
          <strong style={{ color: "var(--text-2)" }}>{filtered.length}</strong>{" "}
          product{filtered.length !== 1 ? "s" : ""}
        </span>

        {search && (
          <span>
            Search results for{" "}
            <strong style={{ color: "var(--text-2)" }}>"{search}"</strong>
          </span>
        )}
      </div>

      {/* Table */}

      <div
        className="rounded-2xl shadow-sm overflow-hidden animate-fade-in-up"
        style={{
          background: "var(--surface)",

          border: "1px solid var(--border)",

          animationDelay: "140ms",
        }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full">
            <thead style={{ background: "var(--table-head)" }}>
              <tr
                style={{
                  borderBottom: "1px solid var(--divider)",
                }}
              >
                {["Product", "SKU", "Price", "Qty", "Status", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: "var(--text-3)" }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                        style={{
                          background: "rgba(99,102,241,0.1)",
                        }}
                      >
                        <Package size={26} style={{ color: "#818cf8" }} />
                      </div>

                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--text-1)" }}
                      >
                        No products found
                      </p>

                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--text-3)" }}
                      >
                        {search
                          ? "Try changing your search or stock filter."
                          : "Add your first product to get started."}
                      </p>

                      {!search && stockFilter === "all" && (
                        <button
                          onClick={() => {
                            setEditProduct(null);

                            setModalOpen(true);
                          }}
                          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-400"
                        >
                          <Plus size={14} />
                          Add Product
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((p, idx) => (
                  <tr
                    key={p.id}
                    className="theme-row-hover transition-colors animate-fade-in-up"
                    style={{
                      borderBottom: "1px solid var(--divider)",

                      animationDelay: `${200 + idx * 40}ms`,
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background:
                              "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.15))",
                          }}
                        >
                          <Package size={16} style={{ color: "#818cf8" }} />
                        </div>

                        <div className="min-w-0">
                          <span
                            className="block text-sm font-semibold truncate max-w-[260px]"
                            style={{ color: "var(--text-1)" }}
                            title={p.name}
                          >
                            {p.name}
                          </span>

                          <span
                            className="block text-[11px] mt-0.5"
                            style={{ color: "var(--text-3)" }}
                          >
                            Product
                          </span>
                        </div>
                      </div>
                    </td>

                    <td
                      className="px-6 py-4 text-sm font-mono whitespace-nowrap"
                      style={{ color: "var(--text-3)" }}
                    >
                      {p.sku}
                    </td>

                    <td
                      className="px-6 py-4 text-sm font-bold whitespace-nowrap"
                      style={{ color: "var(--text-1)" }}
                    >
                      {fmt(parseFloat(p.price))}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-bold ${
                          p.quantity === 0
                            ? "text-red-500"
                            : p.quantity < 10
                              ? "text-amber-500"
                              : "text-emerald-500"
                        }`}
                      >
                        {p.quantity}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {p.quantity === 0 ? (
                        <Badge label="Out of Stock" variant="out" />
                      ) : p.quantity < 10 ? (
                        <Badge label="Low Stock" variant="low" />
                      ) : (
                        <Badge label="In Stock" variant="ok" />
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditProduct(p);

                            setModalOpen(true);
                          }}
                          className="btn-icon-edit"
                          title="Edit product"
                          aria-label={`Edit ${p.name}`}
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          onClick={() => setConfirmTarget(p)}
                          className="btn-icon-delete"
                          title="Delete product"
                          aria-label={`Delete ${p.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div
            className="px-4 sm:px-6 py-3"
            style={{
              borderTop: "1px solid var(--divider)",
            }}
          >
            <Pagination
              page={page}
              totalPages={totalPages}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onPage={setPage}
            />
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProduct ? "Edit Product" : "Add Product"}
      >
        <ProductForm
          product={editProduct}
          onSuccess={() => {
            setModalOpen(false);

            fetchProducts();
          }}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => handleDelete(confirmTarget)}
        title="Delete Product"
        message={`"${confirmTarget?.name}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete Product"
        variant="danger"
      />
    </div>
  );
}
