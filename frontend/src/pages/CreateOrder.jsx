import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/client";
import { parseApiError } from "../api/errors";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../components/Toast";

import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  UserRound,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  IndianRupee,
} from "lucide-react";

const formatINR = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });

export default function CreateOrder() {
  const showToast = useToast();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [customerId, setCustomerId] = useState("");
  const [cart, setCart] = useState({});
  const [qtys, setQtys] = useState({});
  const [rowErrors, setRowErrors] = useState({});

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    Promise.all([API.get("/customers"), API.get("/products")])
      .then(([customerResponse, productResponse]) => {
        setCustomers(customerResponse.data);
        setProducts(productResponse.data);

        const initialQtys = {};

        productResponse.data.forEach((product) => {
          initialQtys[product.id] = 1;
        });

        setQtys(initialQtys);
      })
      .catch((err) => {
        showToast(parseApiError(err, "Failed to load order data"), "error");
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const remaining = (product) => product.quantity - (cart[product.id] || 0);

  const stockLabel = (product) => {
    if (product.quantity === 0) return "out";
    if (product.quantity < 10) return "low";
    return "in";
  };

  const setQty = (productId, value, maxRemaining) => {
    const max = Math.max(1, maxRemaining);
    const parsed = parseInt(value, 10);

    const clamped = Math.max(
      1,
      Math.min(max, Number.isNaN(parsed) ? 1 : parsed),
    );

    setQtys((prev) => ({
      ...prev,
      [productId]: clamped,
    }));

    setRowErrors((prev) => ({
      ...prev,
      [productId]: undefined,
    }));
  };

  const addToCart = (product) => {
    const rem = remaining(product);

    if (rem <= 0) {
      setRowErrors((prev) => ({
        ...prev,
        [product.id]: `No more stock available (${product.quantity} total)`,
      }));
      return;
    }

    const qty = Math.min(qtys[product.id] || 1, rem);

    setCart((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + qty,
    }));

    setQtys((prev) => ({
      ...prev,
      [product.id]: 1,
    }));

    setRowErrors((prev) => ({
      ...prev,
      [product.id]: undefined,
    }));
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });

    setQtys((prev) => ({
      ...prev,
      [productId]: 1,
    }));

    setRowErrors((prev) => ({
      ...prev,
      [productId]: undefined,
    }));
  };

  const filteredProducts = useMemo(
    () =>
      products
        .filter((product) => {
          if (stockFilter === "in") {
            return product.quantity >= 10;
          }

          if (stockFilter === "low") {
            return product.quantity > 0 && product.quantity < 10;
          }

          if (stockFilter === "out") {
            return product.quantity === 0;
          }

          return true;
        })
        .filter((product) => {
          const query = search.trim().toLowerCase();

          if (!query) return true;

          return (
            product.name.toLowerCase().includes(query) ||
            product.sku.toLowerCase().includes(query)
          );
        }),
    [products, search, stockFilter],
  );

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([productId, qty]) => ({
          product: products.find((product) => product.id === productId),
          qty,
        }))
        .filter((item) => item.product),
    [cart, products],
  );

  const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.product.price) * item.qty,
    0,
  );

  const stockCounts = {
    all: products.length,
    in: products.filter((product) => product.quantity >= 10).length,
    low: products.filter(
      (product) => product.quantity > 0 && product.quantity < 10,
    ).length,
    out: products.filter((product) => product.quantity === 0).length,
  };

  const handleSubmit = async () => {
    const errors = {};

    if (!customerId) {
      errors.customer = "Select a customer";
    }

    if (cartItems.length === 0) {
      errors.cart = "Add at least one product";
    }

    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      await API.post("/orders", {
        customer_id: customerId,
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.qty,
        })),
      });

      showToast("Order placed successfully");
      navigate("/orders");
    } catch (err) {
      showToast(parseApiError(err, "Failed to place order"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="pb-32 max-w-7xl space-y-5 animate-fade-in-up">
      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/orders")}
            className="btn-icon-view"
            title="Back to orders"
            aria-label="Back to orders"
          >
            <ChevronLeft size={17} />
          </button>

          <div>
            <h2
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: "var(--text-1)" }}
            >
              Create Order
            </h2>

            <p className="text-sm mt-0.5" style={{ color: "var(--text-3)" }}>
              Select a customer and add products to create a new order.
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-2 text-xs font-semibold px-3.5 py-2.5 rounded-xl"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text-2)",
          }}
        >
          <Package size={15} />
          {filteredProducts.length} products available
        </div>
      </div>

      {/* Customer */}

      <section
        className="rounded-2xl p-5 shadow-sm animate-fade-in-up"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(99,102,241,.12)",
              color: "#818cf8",
            }}
          >
            <UserRound size={18} />
          </div>

          <div>
            <h3
              className="text-sm font-bold"
              style={{ color: "var(--text-1)" }}
            >
              Customer
            </h3>

            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              Choose the customer placing this order.
            </p>
          </div>
        </div>

        <select
          value={customerId}
          onChange={(event) => {
            setCustomerId(event.target.value);

            setFormErrors((prev) => ({
              ...prev,
              customer: undefined,
            }));
          }}
          className={`theme-input w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
            formErrors.customer ? "ring-2 ring-red-400" : ""
          }`}
        >
          <option value="">— Select a customer —</option>

          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.full_name} ({customer.email})
            </option>
          ))}
        </select>

        {formErrors.customer && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-400">
            <AlertCircle size={13} />
            {formErrors.customer}
          </p>
        )}
      </section>

      {/* Search + filters */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search
            size={16}
            className="absolute left-3.5 top-3"
            style={{ color: "var(--text-3)" }}
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products by name or SKU..."
            className="theme-input w-full pl-10 pr-10 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5"
              style={{ color: "var(--text-3)" }}
              title="Clear search"
              aria-label="Clear search"
            >
              <XCircle size={16} />
            </button>
          )}
        </div>

        <div
          className="flex gap-1 p-1 rounded-xl overflow-x-auto"
          style={{ background: "var(--surface-2)" }}
        >
          {[
            { key: "all", label: "All" },
            { key: "in", label: "In Stock" },
            { key: "low", label: "Low Stock" },
            { key: "out", label: "Out of Stock" },
          ].map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setStockFilter(filter.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
              style={{
                background:
                  stockFilter === filter.key ? "var(--surface)" : "transparent",
                color:
                  stockFilter === filter.key
                    ? "var(--text-1)"
                    : "var(--text-3)",
                boxShadow:
                  stockFilter === filter.key
                    ? "0 1px 4px rgba(0,0,0,.08)"
                    : "none",
              }}
            >
              {filter.label}

              <span className="ml-1.5 opacity-60">
                {stockCounts[filter.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {formErrors.cart && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium text-red-400 border border-red-500/30"
          style={{
            background: "rgba(248,113,113,.08)",
          }}
        >
          <AlertCircle size={15} />
          {formErrors.cart}
        </div>
      )}

      {/* Product table */}

      <section
        className="rounded-2xl shadow-sm overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          style={{
            borderBottom: "1px solid var(--divider)",
          }}
        >
          <div>
            <h3
              className="text-sm font-bold"
              style={{ color: "var(--text-1)" }}
            >
              Products
            </h3>

            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              Choose quantity and add products to the order.
            </p>
          </div>

          <span
            className="self-start sm:self-auto text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: "var(--accent-subtle)",
              color: "var(--accent-text)",
            }}
          >
            {cartItems.length} in cart
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full">
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
                  "Product",
                  "Price",
                  "Stock",
                  "Quantity",
                  "Cart",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider"
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
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Package
                      size={32}
                      className="mx-auto mb-3"
                      style={{
                        color: "var(--text-3)",
                      }}
                    />

                    <p
                      className="text-sm font-medium"
                      style={{
                        color: "var(--text-2)",
                      }}
                    >
                      No products found
                    </p>

                    <p
                      className="text-xs mt-1"
                      style={{
                        color: "var(--text-3)",
                      }}
                    >
                      Try changing your search or stock filter.
                    </p>
                  </td>
                </tr>
              )}

              {filteredProducts.map((product) => {
                const inCart = !!cart[product.id];
                const cartQty = cart[product.id] || 0;
                const rem = remaining(product);
                const stock = stockLabel(product);
                const pendingQty = qtys[product.id] || 1;
                const rowError = rowErrors[product.id];

                const outOfStock = product.quantity === 0;

                const fullyAllocated = rem <= 0 && inCart;

                let rowBackground = "transparent";

                if (outOfStock) {
                  rowBackground = "rgba(239,68,68,.045)";
                } else if (stock === "low") {
                  rowBackground = "rgba(245,158,11,.045)";
                } else if (inCart) {
                  rowBackground = "rgba(99,102,241,.055)";
                }

                return (
                  <React.Fragment key={product.id}>
                    <tr
                      className="theme-row-hover transition-colors"
                      style={{
                        background: rowBackground,
                        borderBottom: "1px solid var(--divider)",
                        opacity: outOfStock ? 0.78 : 1,
                      }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: "rgba(99,102,241,.10)",
                              color: "#818cf8",
                            }}
                          >
                            <Package size={16} />
                          </div>

                          <div>
                            <p
                              className="text-sm font-semibold"
                              style={{
                                color: "var(--text-1)",
                              }}
                            >
                              {product.name}
                            </p>

                            <p
                              className="text-xs font-mono mt-0.5"
                              style={{
                                color: "var(--text-3)",
                              }}
                            >
                              {product.sku}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td
                        className="px-5 py-4 text-sm font-bold"
                        style={{
                          color: "var(--text-1)",
                        }}
                      >
                        {formatINR(parseFloat(product.price))}
                      </td>

                      <td className="px-5 py-4">
                        {outOfStock ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{
                              color: "#f87171",
                              background: "rgba(248,113,113,.12)",
                            }}
                          >
                            <XCircle size={12} />
                            Out of Stock
                          </span>
                        ) : stock === "low" ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{
                              color: "#fbbf24",
                              background: "rgba(251,191,36,.12)",
                            }}
                          >
                            ⚠ {product.quantity} left
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{
                              color: "#34d399",
                              background: "rgba(52,211,153,.12)",
                            }}
                          >
                            <CheckCircle2 size={12} />
                            {product.quantity} available
                          </span>
                        )}

                        {inCart && rem > 0 && (
                          <p
                            className="text-xs mt-1"
                            style={{
                              color: "var(--accent-text)",
                            }}
                          >
                            {rem} remaining
                          </p>
                        )}

                        {fullyAllocated && (
                          <p
                            className="text-xs mt-1 font-medium"
                            style={{
                              color: "#fbbf24",
                            }}
                          >
                            All stock in cart
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {outOfStock ? (
                          <span
                            style={{
                              color: "var(--text-3)",
                            }}
                          >
                            —
                          </span>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setQty(product.id, pendingQty - 1, rem)
                                }
                                disabled={pendingQty <= 1}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 hover:opacity-80"
                                style={{
                                  border: "1px solid var(--border)",
                                  color: "var(--text-2)",
                                  background: "var(--surface-2)",
                                }}
                                aria-label="Decrease quantity"
                              >
                                <Minus size={13} />
                              </button>

                              <input
                                type="number"
                                min="1"
                                max={Math.max(1, rem)}
                                value={pendingQty}
                                onChange={(event) =>
                                  setQty(product.id, event.target.value, rem)
                                }
                                className="w-12 text-center text-sm py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                style={{
                                  border: `1px solid ${
                                    pendingQty > rem
                                      ? "#f87171"
                                      : "var(--border)"
                                  }`,
                                  background:
                                    pendingQty > rem
                                      ? "rgba(248,113,113,.1)"
                                      : "var(--input-bg)",
                                  color: "var(--text-1)",
                                }}
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  setQty(product.id, pendingQty + 1, rem)
                                }
                                disabled={pendingQty >= rem}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 hover:opacity-80"
                                style={{
                                  border: "1px solid var(--border)",
                                  color: "var(--text-2)",
                                  background: "var(--surface-2)",
                                }}
                                aria-label="Increase quantity"
                              >
                                <Plus size={13} />
                              </button>
                            </div>

                            <p
                              className="text-[11px] mt-1"
                              style={{
                                color: "var(--text-3)",
                              }}
                            >
                              max {rem}
                            </p>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {inCart ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-sm font-bold px-2.5 py-1 rounded-full"
                            style={{
                              background: "var(--accent-subtle)",
                              color: "var(--accent-text)",
                            }}
                          >
                            <ShoppingCart size={13} />
                            {cartQty}
                          </span>
                        ) : (
                          <span
                            className="text-xs"
                            style={{
                              color: "var(--text-3)",
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {outOfStock ? (
                          <span
                            className="text-xs font-medium"
                            style={{
                              color: "#f87171",
                            }}
                          >
                            Unavailable
                          </span>
                        ) : fullyAllocated ? (
                          <button
                            type="button"
                            onClick={() => removeFromCart(product.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
                            style={{
                              border: "1px solid rgba(248,113,113,.4)",
                              color: "#f87171",
                              background: "rgba(248,113,113,.08)",
                            }}
                          >
                            <Trash2 size={12} />
                            Remove
                          </button>
                        ) : inCart ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => addToCart(product)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90"
                              style={{
                                background:
                                  "linear-gradient(135deg,var(--accent-from),var(--accent-to))",
                              }}
                            >
                              <Plus size={12} />
                              Add More
                            </button>

                            <button
                              type="button"
                              onClick={() => removeFromCart(product.id)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                              style={{
                                border: "1px solid rgba(248,113,113,.4)",
                                color: "#f87171",
                                background: "rgba(248,113,113,.08)",
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(product)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90"
                            style={{
                              background:
                                "linear-gradient(135deg,var(--accent-from),var(--accent-to))",
                            }}
                          >
                            <Plus size={13} />
                            Add
                          </button>
                        )}
                      </td>
                    </tr>

                    {rowError && (
                      <tr
                        style={{
                          background: "rgba(248,113,113,.08)",
                          borderBottom: "1px solid var(--divider)",
                        }}
                      >
                        <td colSpan={6} className="px-5 py-2">
                          <p
                            className="text-xs font-medium flex items-center gap-1.5"
                            style={{
                              color: "#f87171",
                            }}
                          >
                            <AlertCircle size={13} />
                            {rowError}
                          </p>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sticky cart bar */}

      <div
        className="fixed bottom-0 left-0 right-0 lg:left-64 px-4 sm:px-6 lg:px-8 py-3.5 z-30"
        style={{
          background: "var(--header-bg)",
          borderTop: "1px solid var(--border)",
          boxShadow: "0 -6px 24px rgba(0,0,0,.12)",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: "var(--accent-subtle)",
                  color: "var(--accent-text)",
                }}
              >
                <ShoppingCart size={17} />
              </div>

              <span
                className="text-sm font-semibold"
                style={{
                  color: "var(--text-1)",
                }}
              >
                {cartItems.length} product
                {cartItems.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div
              className="text-sm"
              style={{
                color: "var(--text-2)",
              }}
            >
              Total Qty:{" "}
              <span
                className="font-semibold"
                style={{
                  color: "var(--text-1)",
                }}
              >
                {totalQty}
              </span>
            </div>

            <div
              className="flex items-center gap-1.5 text-sm"
              style={{
                color: "var(--text-2)",
              }}
            >
              <IndianRupee size={14} />
              Total:
              <span
                className="font-extrabold text-base"
                style={{
                  color: "var(--accent-text)",
                }}
              >
                {formatINR(totalAmount)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                border: "1px solid var(--border)",
                color: "var(--text-2)",
                background: "var(--surface-2)",
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || cartItems.length === 0 || !customerId}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(135deg,var(--accent-from),var(--accent-to))",
                boxShadow: "0 4px 14px var(--accent-glow)",
              }}
            >
              {submitting ? "Placing..." : "Place Order →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
