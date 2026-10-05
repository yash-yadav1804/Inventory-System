import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import API from "../api/client";
import Badge from "../components/Badge";
import LoadingSpinner from "../components/LoadingSpinner";

import {
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

import Pagination from "../components/Pagination";

const ORDERS_PAGE_SIZE = 5;

function useCountUp(target, duration = 900) {
  const [count, setCount] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }

    let start = null;
    const isFloat = !Number.isInteger(target);

    const step = (ts) => {
      if (!start) start = ts;

      const p = Math.min((ts - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);

      setCount(
        isFloat ? parseFloat((e * target).toFixed(2)) : Math.floor(e * target),
      );

      if (p < 1) {
        raf.current = requestAnimationFrame(step);
      }
    };

    raf.current = requestAnimationFrame(step);

    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return count;
}

const STATS = [
  {
    key: "products",
    label: "Total Products",
    icon: Package,
    gradient: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    glow: "rgba(59,130,246,0.35)",
    delay: 0,
  },
  {
    key: "customers",
    label: "Total Customers",
    icon: Users,
    gradient: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
    glow: "rgba(139,92,246,0.35)",
    delay: 80,
  },
  {
    key: "orders",
    label: "Total Orders",
    icon: ShoppingCart,
    gradient: "linear-gradient(135deg,#10b981,#059669)",
    glow: "rgba(16,185,129,0.35)",
    delay: 160,
  },
  {
    key: "revenue",
    label: "Confirmed Revenue",
    icon: TrendingUp,
    gradient: "linear-gradient(135deg,#f59e0b,#d97706)",
    glow: "rgba(245,158,11,0.35)",
    delay: 240,
  },
];

function StatCard({ config, value, isCurrency }) {
  const animated = useCountUp(isCurrency ? parseFloat(value) : value);

  const display = isCurrency
    ? animated.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      })
    : animated;

  const { icon: Icon, label, gradient, glow, delay } = config;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-white card-hover cursor-default stat-shimmer animate-fade-in-up"
      style={{
        background: gradient,
        boxShadow: `0 8px 24px -4px ${glow}, 0 2px 8px -2px rgba(0,0,0,0.15)`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 bg-white" />
      <div className="absolute -right-2 -bottom-6 w-16 h-16 rounded-full opacity-5 bg-white" />

      <div className="relative">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <Icon size={20} color="white" />
        </div>

        <p className="text-sm font-medium opacity-80 mb-1">{label}</p>

        <p className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">
          {display}
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);

  useEffect(() => {
    Promise.all([
      API.get("/products"),
      API.get("/customers"),
      API.get("/orders"),
    ])
      .then(([p, c, o]) => {
        setProducts(p.data);
        setCustomers(c.data);
        setOrders(o.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  const totalRevenue = orders
    .filter((o) => o.status === "confirmed")
    .reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0);

  const lowStock = products.filter((p) => p.quantity < 10);

  const sortedOrders = [...orders].reverse();

  const ordersTotalPages = Math.ceil(sortedOrders.length / ORDERS_PAGE_SIZE);

  const recentOrders = sortedOrders.slice(
    (ordersPage - 1) * ORDERS_PAGE_SIZE,
    ordersPage * ORDERS_PAGE_SIZE,
  );

  const custMap = customers.reduce((m, c) => {
    m[c.id] = c;
    return m;
  }, {});

  const statValues = {
    products: products.length,
    customers: customers.length,
    orders: orders.length,
    revenue: totalRevenue,
  };

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{ color: "var(--text-1)" }}
            >
              Overview
            </h2>

            <span
              className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: "rgba(99,102,241,0.1)",
                color: "#818cf8",
              }}
            >
              Dashboard
            </span>
          </div>

          <p className="text-sm" style={{ color: "var(--text-3)" }}>
            Welcome back — here's what's happening today.
          </p>
        </div>

        <div className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
          {orders.length} total order{orders.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <StatCard
            key={s.key}
            config={s}
            value={statValues[s.key]}
            isCurrency={s.key === "revenue"}
          />
        ))}
      </div>

      {/* Quick summary */}
      <div
        className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          animationDelay: "280ms",
        }}
      >
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-1"
            style={{ color: "var(--text-3)" }}
          >
            Business Snapshot
          </p>

          <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
            {lowStock.length > 0
              ? `${lowStock.length} product${
                  lowStock.length !== 1 ? "s are" : " is"
                } running low on stock.`
              : "All products currently have healthy stock levels."}
          </p>
        </div>

        <button
          onClick={() => navigate("/products")}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
          style={{
            background: "rgba(99,102,241,0.1)",
            color: "#818cf8",
          }}
        >
          Manage Products
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Low stock */}
      {lowStock.length > 0 && (
        <div
          className="rounded-2xl shadow-sm overflow-hidden animate-fade-in-up"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            animationDelay: "300ms",
          }}
        >
          <div
            className="px-5 sm:px-6 py-4 flex items-center gap-3"
            style={{
              borderBottom: "1px solid var(--divider)",
            }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(245,158,11,0.12)",
              }}
            >
              <AlertTriangle
                size={15}
                className="text-amber-600 dark:text-amber-400"
              />
            </div>

            <div>
              <h3
                className="text-sm font-bold"
                style={{ color: "var(--text-1)" }}
              >
                Low Stock Alert
              </h3>

              <p
                className="text-[11px] mt-0.5"
                style={{ color: "var(--text-3)" }}
              >
                Products that need attention
              </p>
            </div>

            <span className="ml-auto text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full">
              {lowStock.length} item
              {lowStock.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead style={{ background: "var(--table-head)" }}>
                <tr
                  style={{
                    borderBottom: "1px solid var(--divider)",
                  }}
                >
                  {["Product", "SKU", "Qty", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: "var(--text-3)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {lowStock.map((p) => (
                  <tr
                    key={p.id}
                    className="theme-row-hover transition-colors"
                    style={{
                      borderBottom: "1px solid var(--divider)",
                    }}
                  >
                    <td
                      className="px-5 sm:px-6 py-3.5 text-sm font-medium whitespace-nowrap"
                      style={{ color: "var(--text-1)" }}
                    >
                      {p.name}
                    </td>

                    <td
                      className="px-5 sm:px-6 py-3.5 text-sm font-mono whitespace-nowrap"
                      style={{ color: "var(--text-3)" }}
                    >
                      {p.sku}
                    </td>

                    <td className="px-5 sm:px-6 py-3.5 text-sm font-bold text-amber-600 whitespace-nowrap">
                      {p.quantity}
                    </td>

                    <td className="px-5 sm:px-6 py-3.5 whitespace-nowrap">
                      <Badge
                        label={p.quantity === 0 ? "Out of Stock" : "Low Stock"}
                        variant={p.quantity === 0 ? "out" : "low"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div
        className="rounded-2xl shadow-sm overflow-hidden animate-fade-in-up"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          animationDelay: "360ms",
        }}
      >
        <div
          className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          style={{
            borderBottom: "1px solid var(--divider)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              }}
            >
              <ShoppingCart size={14} color="white" />
            </div>

            <div>
              <h3
                className="text-sm font-bold"
                style={{ color: "var(--text-1)" }}
              >
                Recent Orders
              </h3>

              <p
                className="text-[11px] mt-0.5"
                style={{ color: "var(--text-3)" }}
              >
                Latest activity from your store
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/orders")}
            className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
          >
            View all
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead style={{ background: "var(--table-head)" }}>
              <tr
                style={{
                  borderBottom: "1px solid var(--divider)",
                }}
              >
                {["Order ID", "Customer", "Status", "Amount"].map((h) => (
                  <th
                    key={h}
                    className="px-5 sm:px-6 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: "var(--text-3)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-14 text-center">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                        style={{
                          background: "rgba(99,102,241,0.1)",
                        }}
                      >
                        <ShoppingCart size={20} className="text-indigo-400" />
                      </div>

                      <p
                        className="text-sm font-semibold mb-1"
                        style={{ color: "var(--text-1)" }}
                      >
                        No orders yet
                      </p>

                      <p
                        className="text-xs mb-3"
                        style={{ color: "var(--text-3)" }}
                      >
                        Create your first order to see it here.
                      </p>

                      <button
                        onClick={() => navigate("/orders/new")}
                        className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
                      >
                        Create an order →
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                recentOrders.map((o, idx) => {
                  const cust = custMap[o.customer_id];

                  return (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`/orders/${o.id}`)}
                      className="cursor-pointer theme-row-hover transition-colors animate-fade-in-up"
                      style={{
                        borderBottom: "1px solid var(--divider)",
                        animationDelay: `${400 + idx * 60}ms`,
                      }}
                    >
                      <td
                        className="px-5 sm:px-6 py-4 text-sm font-mono font-semibold whitespace-nowrap"
                        style={{ color: "var(--text-1)" }}
                      >
                        #{String(o.id).substring(0, 8).toUpperCase()}
                      </td>

                      <td className="px-5 sm:px-6 py-4 min-w-[200px]">
                        <p
                          className="text-sm font-medium truncate max-w-[240px]"
                          style={{ color: "var(--text-1)" }}
                        >
                          {cust ? cust.full_name : "—"}
                        </p>

                        {cust && (
                          <p
                            className="text-xs truncate max-w-[240px] mt-0.5"
                            style={{ color: "var(--text-3)" }}
                          >
                            {cust.email}
                          </p>
                        )}
                      </td>

                      <td className="px-5 sm:px-6 py-4 whitespace-nowrap">
                        <Badge label={o.status} variant={o.status} />
                      </td>

                      <td
                        className="px-5 sm:px-6 py-4 text-sm font-bold whitespace-nowrap"
                        style={{ color: "var(--text-1)" }}
                      >
                        {parseFloat(o.total_amount).toLocaleString("en-IN", {
                          style: "currency",
                          currency: "INR",
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {sortedOrders.length > 0 && (
          <div
            className="px-4 sm:px-6 py-3"
            style={{
              borderTop: "1px solid var(--divider)",
            }}
          >
            <Pagination
              page={ordersPage}
              totalPages={ordersTotalPages}
              total={sortedOrders.length}
              pageSize={ORDERS_PAGE_SIZE}
              onPage={setOrdersPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
