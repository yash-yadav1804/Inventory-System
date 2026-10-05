import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import API from "../api/client";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import { parseApiError } from "../api/errors";

import {
  ShoppingCart,
  Search,
  Eye,
  XCircle,
  Plus,
  CheckCircle,
  Download,
  UserRound,
  Package,
  CircleDollarSign,
  ClipboardList,
  RefreshCw,
  CalendarDays,
  Mail,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 10;

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

function formatINR(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });
}

function shortOrderId(id) {
  return `#${String(id || "")
    .substring(0, 8)
    .toUpperCase()}`;
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* -------------------------------------------------------
   Export Report
------------------------------------------------------- */

function exportReport(rows, customers, filename) {
  const headers = [
    "Order ID",
    "Date",
    "Customer Name",
    "Customer Email",
    "Items",
    "Total Amount",
    "Status",
  ];

  const statusColor = (status) => {
    if (status === "confirmed") return "#065f46";
    if (status === "cancelled") return "#991b1b";
    return "#92400e";
  };

  const statusBg = (status) => {
    if (status === "confirmed") return "#d1fae5";
    if (status === "cancelled") return "#fee2e2";
    return "#fef3c7";
  };

  const rowsHtml = rows
    .map((order) => {
      const customer = customers[order.customer_id];
      const status = order.status || "pending";

      const cells = [
        `<td style="font-family:monospace;font-weight:600">${shortOrderId(
          order.id,
        )}</td>`,

        `<td>${
          order.created_at
            ? new Date(order.created_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"
        }</td>`,

        `<td style="font-weight:500">${
          customer ? customer.full_name : "—"
        }</td>`,

        `<td style="color:#4b5563">${customer ? customer.email : "—"}</td>`,

        `<td style="text-align:center">${(order.items || []).length}</td>`,

        `<td style="font-weight:700;text-align:right">${formatINR(
          parseFloat(order.total_amount || 0),
        )}</td>`,

        `<td style="text-align:center">
          <span
            style="
              background:${statusBg(status)};
              color:${statusColor(status)};
              padding:2px 10px;
              border-radius:99px;
              font-size:11px;
              font-weight:700;
              text-transform:capitalize;
            "
          >
            ${status}
          </span>
        </td>`,
      ].join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");

  const totalConfirmed = rows
    .filter((order) => order.status === "confirmed")
    .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

  const html = `
<html
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns="http://www.w3.org/TR/REC-html40"
>
<head>
  <meta charset="UTF-8">
</head>

<body>
  <table
    style="
      border-collapse:collapse;
      font-family:Arial,sans-serif;
      font-size:13px;
      width:100%;
    "
  >
    <thead>
      <tr>
        <td
          colspan="7"
          style="
            background:#1e1b4b;
            color:#ffffff;
            font-size:16px;
            font-weight:700;
            padding:14px 16px;
            letter-spacing:0.5px;
          "
        >
          Sales Report
          &nbsp;&nbsp;
          <span
            style="
              font-size:11px;
              font-weight:400;
              opacity:0.7;
            "
          >
            Generated ${new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
        </td>
      </tr>

      <tr>
        <td
          colspan="7"
          style="
            background:#4338ca;
            color:#c7d2fe;
            font-size:11px;
            padding:6px 16px;
          "
        >
          ${rows.length} orders total
          &nbsp;·&nbsp;
          Confirmed revenue:
          <strong style="color:#ffffff">
            ${formatINR(totalConfirmed)}
          </strong>
        </td>
      </tr>

      <tr style="background:#6366f1">
        ${headers
          .map(
            (header) => `
              <th
                style="
                  color:#ffffff;
                  font-size:11px;
                  font-weight:700;
                  text-transform:uppercase;
                  letter-spacing:0.8px;
                  padding:10px 14px;
                  text-align:left;
                  border-bottom:2px solid #4338ca;
                "
              >
                ${header}
              </th>
            `,
          )
          .join("")}
      </tr>
    </thead>

    <tbody>
      ${rowsHtml}
    </tbody>

    <tfoot>
      <tr style="background:#f1f5f9">
        <td
          colspan="5"
          style="
            padding:10px 14px;
            font-size:12px;
            color:#6b7280;
            font-weight:600;
          "
        >
          Total (confirmed orders only)
        </td>

        <td
          style="
            padding:10px 14px;
            font-weight:800;
            font-size:14px;
            color:#4338ca;
            text-align:right;
          "
        >
          ${formatINR(totalConfirmed)}
        </td>

        <td></td>
      </tr>
    </tfoot>
  </table>
</body>
</html>
`;

  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

/* -------------------------------------------------------
   Main Component
------------------------------------------------------- */

export default function Orders() {
  const showToast = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState({});
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [confirmDialog, setConfirmDialog] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  /* -------------------------------------------------------
     Fetch
  ------------------------------------------------------- */

  const fetchAll = useCallback(() => {
    setLoading(true);

    Promise.all([API.get("/orders"), API.get("/customers")])
      .then(([ordersResponse, customersResponse]) => {
        setOrders(ordersResponse.data);

        const customerMap = {};

        customersResponse.data.forEach((customer) => {
          customerMap[customer.id] = customer;
        });

        setCustomers(customerMap);
      })
      .catch((err) => {
        console.error(err);
        showToast(parseApiError(err, "Failed to load orders"), "error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [showToast]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* -------------------------------------------------------
     Actions
  ------------------------------------------------------- */

  const handleCancel = async (order) => {
    try {
      setActionLoading(true);

      await API.delete(`/orders/${order.id}`);

      showToast("Order cancelled — stock restored");
      setConfirmDialog(null);

      fetchAll();
    } catch (err) {
      showToast(parseApiError(err, "Failed to cancel"), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = async (order) => {
    try {
      setActionLoading(true);

      await API.patch(`/orders/${order.id}/confirm`);

      showToast("Order confirmed successfully");
      setConfirmDialog(null);

      fetchAll();
    } catch (err) {
      showToast(parseApiError(err, "Failed to confirm"), "error");
    } finally {
      setActionLoading(false);
    }
  };

  /* -------------------------------------------------------
     Derived Data
  ------------------------------------------------------- */

  const pending = useMemo(
    () => orders.filter((order) => order.status === "pending"),
    [orders],
  );

  const confirmed = useMemo(
    () => orders.filter((order) => order.status === "confirmed"),
    [orders],
  );

  const cancelled = useMemo(
    () => orders.filter((order) => order.status === "cancelled"),
    [orders],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders
      .filter((order) => filter === "all" || order.status === filter)
      .filter((order) => {
        if (!query) return true;

        const customer = customers[order.customer_id];

        return (
          String(order.id).toLowerCase().includes(query) ||
          String(customer?.full_name || "")
            .toLowerCase()
            .includes(query) ||
          String(customer?.email || "")
            .toLowerCase()
            .includes(query)
        );
      });
  }, [orders, filter, search, customers]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const confirmedRevenue = confirmed.reduce(
    (sum, order) => sum + parseFloat(order.total_amount || 0),
    0,
  );

  const pendingRevenue = pending.reduce(
    (sum, order) => sum + parseFloat(order.total_amount || 0),
    0,
  );

  const summaryCards = [
    {
      label: "Pending Orders",
      count: pending.length,
      amount: formatINR(pendingRevenue),
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.09)",
      border: "rgba(245,158,11,0.22)",
      icon: ClipboardList,
    },
    {
      label: "Confirmed Orders",
      count: confirmed.length,
      amount: formatINR(confirmedRevenue),
      color: "#10b981",
      bg: "rgba(16,185,129,0.09)",
      border: "rgba(16,185,129,0.22)",
      icon: CircleDollarSign,
    },
    {
      label: "Cancelled Orders",
      count: cancelled.length,
      amount: null,
      color: "#f87171",
      bg: "rgba(248,113,113,0.09)",
      border: "rgba(248,113,113,0.22)",
      icon: XCircle,
    },
  ];

  const tabs = [
    {
      key: "all",
      label: "All Orders",
      count: orders.length,
    },
    {
      key: "pending",
      label: "Pending",
      count: pending.length,
    },
    {
      key: "confirmed",
      label: "Confirmed",
      count: confirmed.length,
    },
    {
      key: "cancelled",
      label: "Cancelled",
      count: cancelled.length,
    },
  ];

  /* -------------------------------------------------------
     Loading
  ------------------------------------------------------- */

  if (loading) {
    return <LoadingSpinner />;
  }

  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */

  return (
    <div className="space-y-5 max-w-7xl">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between animate-fade-in-up">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(99,102,241,0.12)",
                color: "#818cf8",
                border: "1px solid rgba(99,102,241,0.18)",
              }}
            >
              <ShoppingCart size={21} />
            </div>

            <div>
              <h2
                className="text-2xl font-extrabold tracking-tight"
                style={{
                  color: "var(--text-1)",
                }}
              >
                Orders
              </h2>

              <p
                className="text-sm mt-0.5"
                style={{
                  color: "var(--text-3)",
                }}
              >
                Manage orders, payments and order status
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            onClick={() => exportReport(orders, customers, "sales-report.xls")}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-1)",
              background: "var(--surface)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <Download size={15} />
            Download Report
          </button>

          <button
            onClick={() => navigate("/orders/new")}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg active:scale-95"
            style={{
              background: "linear-gradient(135deg,#10b981,#059669)",
              boxShadow: "0 4px 14px rgba(16,185,129,0.30)",
            }}
          >
            <Plus size={16} />
            Create Order
          </button>
        </div>
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in-up"
        style={{
          animationDelay: "60ms",
        }}
      >
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-2xl px-5 py-4 card-hover"
              style={{
                background: card.bg,
                border: `1px solid ${card.border}`,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: card.color,
                      }}
                    />

                    <span
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{
                        color: card.color,
                      }}
                    >
                      {card.label}
                    </span>
                  </div>

                  <p
                    className="text-2xl font-extrabold"
                    style={{
                      color: "var(--text-1)",
                    }}
                  >
                    {card.count}
                  </p>

                  {card.amount && (
                    <p
                      className="text-xs font-medium mt-0.5"
                      style={{
                        color: card.color,
                      }}
                    >
                      {card.amount}
                    </p>
                  )}
                </div>

                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(255,255,255,0.48)",
                    color: card.color,
                  }}
                >
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <div
        className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 animate-fade-in-up"
        style={{
          animationDelay: "100ms",
        }}
      >
        <div
          className="flex gap-1 p-1 rounded-xl overflow-x-auto w-full xl:w-auto"
          style={{
            background: "var(--surface-2)",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setFilter(tab.key);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
              style={{
                background:
                  filter === tab.key ? "var(--surface)" : "transparent",
                color: filter === tab.key ? "var(--text-1)" : "var(--text-3)",
                boxShadow:
                  filter === tab.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tab.label}

              <span
                className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  background:
                    filter === tab.key
                      ? "rgba(99,102,241,0.15)"
                      : "rgba(0,0,0,0.06)",
                  color: filter === tab.key ? "#818cf8" : "var(--text-3)",
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full xl:w-auto">
          <div className="relative w-full sm:w-80">
            <Search
              size={15}
              className="absolute left-3.5 top-3"
              style={{
                color: "var(--text-3)",
              }}
            />

            <input
              type="text"
              placeholder="Search by ID, customer or email..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="theme-input w-full pl-9 pr-10 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-2.5 transition-opacity hover:opacity-70"
                style={{
                  color: "var(--text-3)",
                }}
                title="Clear search"
                aria-label="Clear search"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>

          <button
            onClick={fetchAll}
            className="hidden sm:flex w-10 h-10 items-center justify-center rounded-xl transition-all hover:opacity-80 active:scale-95"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
            }}
            title="Refresh orders"
            aria-label="Refresh orders"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* =====================================================
          RESULT INFORMATION
      ====================================================== */}

      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1 animate-fade-in-up"
        style={{
          animationDelay: "120ms",
        }}
      >
        <div className="flex items-center gap-2">
          <p
            className="text-xs"
            style={{
              color: "var(--text-3)",
            }}
          >
            Showing{" "}
            <span
              className="font-semibold"
              style={{
                color: "var(--text-2)",
              }}
            >
              {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
              {filtered.length > 0 &&
                `–${Math.min(page * PAGE_SIZE, filtered.length)}`}
            </span>{" "}
            of{" "}
            <span
              className="font-semibold"
              style={{
                color: "var(--text-2)",
              }}
            >
              {filtered.length}
            </span>{" "}
            orders
          </p>

          {filter !== "all" && (
            <>
              <span
                className="w-1 h-1 rounded-full"
                style={{
                  background: "var(--text-3)",
                }}
              />

              <span
                className="text-xs capitalize"
                style={{
                  color: "var(--text-3)",
                }}
              >
                {filter}
              </span>
            </>
          )}
        </div>

        {search && (
          <p
            className="text-xs"
            style={{
              color: "var(--text-3)",
            }}
          >
            Search results for{" "}
            <span
              className="font-semibold"
              style={{
                color: "var(--text-2)",
              }}
            >
              "{search}"
            </span>
          </p>
        )}
      </div>

      {/* =====================================================
          ORDERS TABLE
      ====================================================== */}

      <div
        className="rounded-2xl shadow-sm overflow-hidden animate-fade-in-up"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          animationDelay: "140ms",
        }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full">
            <thead
              style={{
                background: "var(--table-head)",
              }}
            >
              <tr
                style={{
                  borderBottom: "1px solid var(--divider)",
                }}
              >
                {[
                  "Order & Date",
                  "Customer",
                  "Items",
                  "Amount",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 lg:px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider"
                    style={{
                      color: "var(--text-3)",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                        style={{
                          background: "var(--surface-2)",
                        }}
                      >
                        <ShoppingCart
                          size={27}
                          style={{
                            color: "var(--text-3)",
                          }}
                        />
                      </div>

                      <p
                        className="text-sm font-semibold"
                        style={{
                          color: "var(--text-2)",
                        }}
                      >
                        No orders found
                      </p>

                      <p
                        className="text-xs mt-1 max-w-xs leading-relaxed"
                        style={{
                          color: "var(--text-3)",
                        }}
                      >
                        {search
                          ? "Try changing your search or clearing the filter."
                          : "There are no orders matching the selected status."}
                      </p>

                      {(search || filter !== "all") && (
                        <button
                          onClick={() => {
                            setSearch("");
                            setFilter("all");
                            setPage(1);
                          }}
                          className="mt-4 text-xs font-semibold px-3 py-2 rounded-lg transition-all hover:opacity-80"
                          style={{
                            color: "#818cf8",
                            background: "rgba(99,102,241,0.10)",
                          }}
                        >
                          Clear filters
                        </button>
                      )}

                      {!search && filter === "all" && orders.length === 0 && (
                        <button
                          onClick={() => navigate("/orders/new")}
                          className="mt-4 flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg text-white transition-all hover:opacity-90"
                          style={{
                            background:
                              "linear-gradient(135deg,#10b981,#059669)",
                          }}
                        >
                          <Plus size={13} />
                          Create your first order
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((order, index) => {
                  const customer = customers[order.customer_id];

                  const itemCount = (order.items || []).length;

                  return (
                    <tr
                      key={order.id}
                      className="theme-row-hover transition-colors animate-fade-in-up"
                      style={{
                        borderBottom: "1px solid var(--divider)",
                        animationDelay: `${200 + index * 40}ms`,
                      }}
                    >
                      {/* Order */}
                      <td className="px-5 lg:px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center flex-shrink-0"
                            style={{
                              background: "rgba(99,102,241,0.10)",
                              color: "#818cf8",
                            }}
                          >
                            <Package size={16} />
                          </div>

                          <div>
                            <p
                              className="text-sm font-mono font-semibold"
                              style={{
                                color: "var(--text-1)",
                              }}
                            >
                              {shortOrderId(order.id)}
                            </p>

                            <div className="flex items-center gap-1.5 mt-1">
                              <CalendarDays
                                size={11}
                                style={{
                                  color: "var(--text-3)",
                                }}
                              />

                              <p
                                className="text-xs"
                                style={{
                                  color: "var(--text-3)",
                                }}
                              >
                                {formatDate(order.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-5 lg:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              background: "rgba(16,185,129,0.10)",
                              color: "#10b981",
                            }}
                          >
                            <UserRound size={14} />
                          </div>

                          <div className="min-w-0">
                            <p
                              className="text-sm font-medium truncate max-w-[190px]"
                              style={{
                                color: "var(--text-1)",
                              }}
                              title={customer?.full_name || ""}
                            >
                              {customer ? customer.full_name : "—"}
                            </p>

                            {customer?.email && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Mail
                                  size={10}
                                  style={{
                                    color: "var(--text-3)",
                                  }}
                                />

                                <p
                                  className="text-xs truncate max-w-[170px]"
                                  style={{
                                    color: "var(--text-3)",
                                  }}
                                  title={customer.email}
                                >
                                  {customer.email}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Items */}
                      <td
                        className="px-5 lg:px-6 py-4 text-sm"
                        style={{
                          color: "var(--text-2)",
                        }}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className="font-semibold"
                            style={{
                              color: "var(--text-1)",
                            }}
                          >
                            {itemCount}
                          </span>

                          <span>{itemCount === 1 ? "item" : "items"}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-5 lg:px-6 py-4">
                        <p
                          className="text-sm font-bold whitespace-nowrap"
                          style={{
                            color: "var(--text-1)",
                          }}
                        >
                          {formatINR(parseFloat(order.total_amount || 0))}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-5 lg:px-6 py-4">
                        <Badge label={order.status} variant={order.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 lg:px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="btn-icon-view"
                            title="View order"
                            aria-label="View order"
                          >
                            <Eye size={14} />
                          </button>

                          {order.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  setConfirmDialog({
                                    type: "confirm",
                                    order,
                                  })
                                }
                                className="btn-icon-confirm"
                                title="Confirm order"
                                aria-label="Confirm order"
                              >
                                <CheckCircle size={14} />
                              </button>

                              <button
                                onClick={() =>
                                  setConfirmDialog({
                                    type: "cancel",
                                    order,
                                  })
                                }
                                className="btn-icon-delete"
                                title="Cancel order"
                                aria-label="Cancel order"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg transition-all hover:opacity-70"
                            style={{
                              color: "var(--text-3)",
                            }}
                            title="Open details"
                            aria-label="Open details"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div
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

      {/* =====================================================
          CANCEL DIALOG
      ====================================================== */}

      <ConfirmDialog
        open={confirmDialog?.type === "cancel"}
        onClose={() => {
          if (!actionLoading) {
            setConfirmDialog(null);
          }
        }}
        onConfirm={() => handleCancel(confirmDialog.order)}
        title="Cancel Order"
        message={`Order ${shortOrderId(
          confirmDialog?.order?.id,
        )} will be cancelled and stock will be restored. This cannot be undone.`}
        confirmLabel={actionLoading ? "Cancelling..." : "Cancel Order"}
        variant="danger"
      />

      {/* =====================================================
          CONFIRM DIALOG
      ====================================================== */}

      <ConfirmDialog
        open={confirmDialog?.type === "confirm"}
        onClose={() => {
          if (!actionLoading) {
            setConfirmDialog(null);
          }
        }}
        onConfirm={() => handleConfirm(confirmDialog.order)}
        title="Confirm Order"
        message={`Mark order ${shortOrderId(
          confirmDialog?.order?.id,
        )} as confirmed?`}
        confirmLabel={actionLoading ? "Confirming..." : "Confirm Order"}
        variant="warning"
      />
    </div>
  );
}
