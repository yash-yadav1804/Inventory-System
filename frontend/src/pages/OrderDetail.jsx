import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import API from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import Badge from "../components/Badge";
import { useToast } from "../components/Toast";

import {
  ArrowLeft,
  Package,
  Hash,
  IndianRupee,
  XCircle,
  CheckCircle,
  UserRound,
  CalendarDays,
} from "lucide-react";

import ConfirmDialog from "../components/ConfirmDialog";
import { parseApiError } from "../api/errors";

const STEPS = [
  {
    key: "pending",
    label: "Pending",
    icon: "⏳",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    icon: "✓",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    icon: "✕",
  },
];

function StatusPipeline({ status }) {
  const activeIdx = STEPS.findIndex((step) => step.key === status);

  const isCancelled = status === "cancelled";

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, index) => {
        const isActive = step.key === status;

        let circleStyle = {
          width: 36,
          height: 36,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
          border: "2px solid",
          flexShrink: 0,
        };

        if (isActive && isCancelled) {
          circleStyle = {
            ...circleStyle,
            background: "rgba(248,113,113,.15)",
            borderColor: "#f87171",
            color: "#f87171",
          };
        } else if (isActive) {
          circleStyle = {
            ...circleStyle,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            borderColor: "transparent",
            color: "white",
            boxShadow: "0 4px 12px rgba(99,102,241,.4)",
          };
        } else if (index < activeIdx && !isCancelled) {
          circleStyle = {
            ...circleStyle,
            background: "rgba(99,102,241,.1)",
            borderColor: "rgba(99,102,241,.3)",
            color: "#818cf8",
          };
        } else {
          circleStyle = {
            ...circleStyle,
            background: "var(--surface-2)",
            borderColor: "var(--border)",
            color: "var(--text-3)",
          };
        }

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center">
              <div style={circleStyle}>{step.icon}</div>

              <span
                className="text-xs font-medium mt-1"
                style={{
                  color: isActive
                    ? isCancelled
                      ? "#f87171"
                      : "#818cf8"
                    : "var(--text-3)",
                }}
              >
                {step.label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className="h-0.5 w-10 sm:w-14 mb-4 mx-1 rounded-full"
                style={{
                  background:
                    index < activeIdx && !isCancelled
                      ? "rgba(99,102,241,.35)"
                      : "var(--border)",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    API.get(`/orders/${id}`)
      .then((response) => setOrder(response.data))
      .catch((err) => setError(parseApiError(err, "Order not found")))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    setCancelling(true);

    try {
      await API.delete(`/orders/${id}`);

      showToast("Order cancelled — stock restored");

      navigate("/orders");
    } catch (err) {
      showToast(parseApiError(err, "Failed to cancel"), "error");

      setCancelling(false);
    }
  };

  const handleConfirm = async () => {
    try {
      const response = await API.patch(`/orders/${id}/confirm`);

      showToast("Order confirmed successfully");

      setConfirmOpen(false);
      setOrder(response.data);
    } catch (err) {
      showToast(parseApiError(err, "Failed to confirm"), "error");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div
          className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{
            background: "rgba(248,113,113,.1)",
            color: "#f87171",
          }}
        >
          <XCircle size={26} />
        </div>

        <p className="text-sm mb-4" style={{ color: "#f87171" }}>
          {error}
        </p>

        <Link
          to="/orders"
          className="text-sm font-medium text-indigo-500 hover:underline"
        >
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const items = order.items || [];

  const totalAmount = parseFloat(order.total_amount || 0);

  const totalQty = items.reduce(
    (sum, item) => sum + (parseInt(item.quantity, 10) || 0),
    0,
  );

  const fmt = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });

  const STAT_ITEMS = [
    {
      label: "Products",
      value: items.length,
      icon: Package,
      iconBg: "rgba(99,102,241,.12)",
      iconColor: "#818cf8",
    },
    {
      label: "Total Qty",
      value: totalQty,
      icon: Hash,
      iconBg: "rgba(16,185,129,.12)",
      iconColor: "#34d399",
    },
    {
      label: "Status",
      value: null,
      icon: null,
      badge: order.status,
    },
    {
      label: "Total Amount",
      value: fmt(totalAmount),
      icon: IndianRupee,
      iconBg: "rgba(245,158,11,.12)",
      iconColor: "#fbbf24",
      highlight: true,
    },
  ];

  return (
    <div className="space-y-5 max-w-5xl animate-fade-in-up">
      {/* Back */}

      <button
        onClick={() => navigate("/orders")}
        className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-indigo-500"
        style={{ color: "var(--text-3)" }}
      >
        <ArrowLeft size={15} />
        Back to Orders
      </button>

      {/* Header */}

      <div
        className="rounded-2xl shadow-sm overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="h-1.5 w-full"
          style={{
            background: "linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899)",
          }}
        />

        <div className="px-5 sm:px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2
                  className="text-lg font-extrabold"
                  style={{
                    color: "var(--text-1)",
                  }}
                >
                  Order #{String(order.id).substring(0, 8).toUpperCase()}
                </h2>

                <Badge label={order.status} variant={order.status} />
              </div>

              {order.customer && (
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className="text-sm font-medium flex items-center gap-1.5"
                    style={{
                      color: "var(--text-2)",
                    }}
                  >
                    <UserRound size={14} />
                    {order.customer.full_name}
                  </p>

                  <span
                    className="text-xs"
                    style={{
                      color: "var(--text-3)",
                    }}
                  >
                    {order.customer.email}
                  </span>
                </div>
              )}

              <p
                className="text-xs mt-2 flex items-center gap-1.5"
                style={{
                  color: "var(--text-3)",
                }}
              >
                <CalendarDays size={13} />
                Placed on{" "}
                {order.created_at
                  ? new Date(order.created_at).toLocaleString("en-IN")
                  : "—"}
              </p>
            </div>

            <div className="overflow-x-auto pb-1">
              <StatusPipeline status={order.status} />
            </div>
          </div>

          {/* Stats */}

          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4"
            style={{
              borderTop: "1px solid var(--divider)",
            }}
          >
            {STAT_ITEMS.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="rounded-xl p-3.5 text-center"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <p
                    className="text-[11px] font-semibold uppercase tracking-wide mb-2"
                    style={{
                      color: "var(--text-3)",
                    }}
                  >
                    {stat.label}
                  </p>

                  {stat.badge ? (
                    <div className="flex justify-center">
                      <Badge label={stat.badge} variant={stat.badge} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5">
                      {Icon && (
                        <Icon
                          size={15}
                          style={{
                            color: stat.highlight ? "#818cf8" : stat.iconColor,
                          }}
                        />
                      )}

                      <p
                        className="text-xl font-extrabold"
                        style={{
                          color: stat.highlight ? "#818cf8" : "var(--text-1)",
                        }}
                      >
                        {stat.value}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Items */}

      <div
        className="rounded-2xl shadow-sm overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="px-5 sm:px-6 py-4 flex items-center justify-between gap-3"
          style={{
            borderBottom: "1px solid var(--divider)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              }}
            >
              <Package size={14} color="white" />
            </div>

            <div>
              <h3
                className="text-sm font-bold"
                style={{
                  color: "var(--text-1)",
                }}
              >
                Order Items
              </h3>

              <p
                className="text-[11px] mt-0.5"
                style={{
                  color: "var(--text-3)",
                }}
              >
                Products included in this order
              </p>
            </div>
          </div>

          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(99,102,241,.1)",
              color: "#818cf8",
            }}
          >
            {items.length} item
            {items.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[650px] w-full">
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
                {["Product & SKU", "Unit Price", "Qty", "Amount"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider"
                      style={{
                        color: "var(--text-3)",
                      }}
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {items.map((item, index) => {
                const unitPrice = parseFloat(item.unit_price || 0);

                const qty = parseInt(item.quantity, 10) || 0;

                return (
                  <tr
                    key={index}
                    className="theme-row-hover transition-colors"
                    style={{
                      borderBottom: "1px solid var(--divider)",
                    }}
                  >
                    <td className="px-5 sm:px-6 py-4">
                      <p
                        className="text-sm font-semibold"
                        style={{
                          color: "var(--text-1)",
                        }}
                      >
                        {item.product?.name || "—"}
                      </p>

                      <p
                        className="text-xs font-mono mt-0.5"
                        style={{
                          color: "var(--text-3)",
                        }}
                      >
                        {item.product?.sku ||
                          String(item.product_id).substring(0, 8)}
                      </p>
                    </td>

                    <td
                      className="px-5 sm:px-6 py-4 text-sm"
                      style={{
                        color: "var(--text-2)",
                      }}
                    >
                      {fmt(unitPrice)}
                    </td>

                    <td
                      className="px-5 sm:px-6 py-4 text-sm font-bold"
                      style={{
                        color: "var(--text-1)",
                      }}
                    >
                      {qty}
                    </td>

                    <td
                      className="px-5 sm:px-6 py-4 text-sm font-bold"
                      style={{
                        color: "var(--text-1)",
                      }}
                    >
                      {fmt(unitPrice * qty)}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr
                style={{
                  background: "var(--surface-2)",
                  borderTop: "2px solid var(--border)",
                }}
              >
                <td
                  colSpan={3}
                  className="px-5 sm:px-6 py-4 text-sm font-semibold text-right"
                  style={{
                    color: "var(--text-2)",
                  }}
                >
                  Total Amount
                </td>

                <td
                  className="px-5 sm:px-6 py-4 text-base font-extrabold"
                  style={{
                    color: "#818cf8",
                  }}
                >
                  {fmt(totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Actions */}

        <div
          className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          style={{
            background: "var(--surface-2)",
            borderTop: "1px solid var(--divider)",
          }}
        >
          <div>
            {order.status === "cancelled" && (
              <span
                className="text-sm italic"
                style={{
                  color: "var(--text-3)",
                }}
              >
                This order has been cancelled.
              </span>
            )}

            {order.status === "confirmed" && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-500">
                <CheckCircle size={14} />
                Order confirmed
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {order.status === "pending" && (
              <button
                onClick={() => setConfirmOpen("confirm")}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg,#10b981,#059669)",
                  boxShadow: "0 4px 14px rgba(16,185,129,.35)",
                }}
              >
                <CheckCircle size={15} />
                Confirm Order
              </button>
            )}

            {order.status === "pending" && (
              <button
                onClick={() => setConfirmOpen("cancel")}
                disabled={cancelling}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg,#f43f5e,#e11d48)",
                  boxShadow: "0 4px 14px rgba(244,63,94,.35)",
                }}
              >
                <XCircle size={15} />
                {cancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen === "cancel"}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Order"
        message="This order will be cancelled and all stock will be restored. This cannot be undone."
        confirmLabel="Cancel Order"
        variant="danger"
      />

      <ConfirmDialog
        open={confirmOpen === "confirm"}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="Confirm Order"
        message="Mark this order as confirmed? The order status will be updated to confirmed."
        confirmLabel="Confirm Order"
        variant="warning"
      />
    </div>
  );
}
