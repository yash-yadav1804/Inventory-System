import React, { useState } from "react";
import API from "../api/client";
import { parseApiError } from "../api/errors";
import { useToast } from "../components/Toast";

import {
  Package,
  Hash,
  IndianRupee,
  Boxes,
  Save,
  Plus,
  AlertCircle,
} from "lucide-react";

export default function ProductForm({ product, onSuccess }) {
  const showToast = useToast();
  const isEdit = !!product?.id;

  const [form, setForm] = useState({
    name: product?.name || "",
    sku: product?.sku || "",
    price: product?.price ?? "",
    quantity: product?.quantity ?? 0,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};

    if (!form.name.trim()) {
      errs.name = "Product name is required";
    }

    if (!form.sku.trim()) {
      errs.sku = "SKU is required";
    }

    if (form.price === "" || Number(form.price) < 0.01) {
      errs.price = "Price must be at least ₹0.01";
    }

    if (
      Number.isNaN(Number(form.quantity)) ||
      parseInt(form.quantity, 10) < 0
    ) {
      errs.quantity = "Quantity cannot be negative";
    }

    return errs;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
      submit: undefined,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity, 10) || 0,
      };

      if (isEdit) {
        await API.put(`/products/${product.id}`, payload);

        showToast("Product updated successfully");
      } else {
        await API.post("/products", payload);

        showToast("Product created successfully");
      }

      onSuccess();
    } catch (err) {
      setErrors({
        submit: parseApiError(err, "Failed to save product"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field, extra = "") =>
    `theme-input block w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all ${
      errors[field] ? "ring-2 ring-red-400" : ""
    } ${extra}`;

  const FieldLabel = ({ children, required = false }) => (
    <label
      className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
      style={{
        color: "var(--text-3)",
      }}
    >
      {children} {required && <span className="text-red-400">*</span>}
    </label>
  );

  const inventoryValue = Number(form.price || 0) * Number(form.quantity || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Form header */}

      <div
        className="flex items-center gap-3 pb-4"
        style={{
          borderBottom: "1px solid var(--divider)",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: "rgba(99,102,241,.12)",
            color: "#818cf8",
          }}
        >
          {isEdit ? <Package size={19} /> : <Plus size={19} />}
        </div>

        <div>
          <h3
            className="text-sm font-bold"
            style={{
              color: "var(--text-1)",
            }}
          >
            {isEdit ? "Edit product" : "Create product"}
          </h3>

          <p
            className="text-xs mt-0.5"
            style={{
              color: "var(--text-3)",
            }}
          >
            {isEdit
              ? "Update product details and inventory."
              : "Add a product to your inventory."}
          </p>
        </div>
      </div>

      {/* Error */}

      {errors.submit && (
        <div
          className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm text-red-400 border border-red-500/30"
          style={{
            background: "rgba(248,113,113,.08)",
          }}
        >
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />

          <span>{errors.submit}</span>
        </div>
      )}

      {/* Name */}

      <div>
        <FieldLabel required>Name</FieldLabel>

        <div className="relative">
          <Package
            size={16}
            className="absolute left-3.5 top-3"
            style={{
              color: "var(--text-3)",
            }}
          />

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Wireless Headphones"
            className={inputClass("name", "pl-10")}
          />
        </div>

        {errors.name && (
          <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>
        )}
      </div>

      {/* SKU */}

      <div>
        <FieldLabel required>SKU</FieldLabel>

        <div className="relative">
          <Hash
            size={16}
            className="absolute left-3.5 top-3"
            style={{
              color: "var(--text-3)",
            }}
          />

          <input
            name="sku"
            value={form.sku}
            onChange={handleChange}
            placeholder="e.g. WH-001"
            className={inputClass("sku", "pl-10 uppercase")}
          />
        </div>

        {errors.sku && (
          <p className="mt-1.5 text-xs text-red-400">{errors.sku}</p>
        )}
      </div>

      {/* Price + quantity */}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <FieldLabel required>Price</FieldLabel>

          <div className="relative">
            <IndianRupee
              size={15}
              className="absolute left-3.5 top-3"
              style={{
                color: "var(--text-3)",
              }}
            />

            <input
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              placeholder="0.00"
              className={inputClass("price", "pl-10")}
            />
          </div>

          {errors.price && (
            <p className="mt-1.5 text-xs text-red-400">{errors.price}</p>
          )}
        </div>

        <div>
          <FieldLabel>Quantity</FieldLabel>

          <div className="relative">
            <Boxes
              size={16}
              className="absolute left-3.5 top-3"
              style={{
                color: "var(--text-3)",
              }}
            />

            <input
              name="quantity"
              type="number"
              min="0"
              value={form.quantity}
              onChange={handleChange}
              className={inputClass("quantity", "pl-10")}
            />
          </div>

          {errors.quantity && (
            <p className="mt-1.5 text-xs text-red-400">{errors.quantity}</p>
          )}
        </div>
      </div>

      {/* Inventory value */}

      <div
        className="rounded-xl px-4 py-3.5"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{
                color: "var(--text-3)",
              }}
            >
              Inventory Value
            </p>

            <p
              className="text-xs mt-1"
              style={{
                color: "var(--text-3)",
              }}
            >
              Price × available quantity
            </p>
          </div>

          <p
            className="text-lg font-extrabold"
            style={{
              color: "var(--text-1)",
            }}
          >
            {inventoryValue.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            })}
          </p>
        </div>
      </div>

      {/* Footer */}

      <div
        className="flex justify-end pt-4"
        style={{
          borderTop: "1px solid var(--divider)",
        }}
      >
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            boxShadow: "0 4px 12px rgba(99,102,241,.3)",
          }}
        >
          {submitting ? (
            <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          ) : (
            <Save size={15} />
          )}

          {submitting
            ? "Saving..."
            : isEdit
              ? "Update Product"
              : "Create Product"}
        </button>
      </div>
    </form>
  );
}
