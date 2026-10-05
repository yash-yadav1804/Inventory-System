import React, { useState } from "react";
import API from "../api/client";
import { parseApiError } from "../api/errors";
import { useToast } from "../components/Toast";

import {
  UserRound,
  UserPlus,
  Mail,
  Phone,
  Save,
  AlertCircle,
} from "lucide-react";

export default function CustomerForm({ customer, onSuccess }) {
  const isEdit = !!customer;
  const showToast = useToast();

  const [form, setForm] = useState({
    full_name: customer?.full_name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};

    if (!form.full_name.trim()) {
      errs.full_name = "Full name is required";
    }

    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Enter a valid email address";
    }

    if (form.phone.trim()) {
      const cleanPhone = form.phone.replace(/\D/g, "");

      if (cleanPhone.length < 10 || cleanPhone.length > 15) {
        errs.phone = "Enter a valid phone number";
      }
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
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
      };

      if (isEdit) {
        await API.put(`/customers/${customer.id}`, payload);

        showToast("Customer updated successfully");
      } else {
        await API.post("/customers", payload);

        showToast("Customer added successfully");
      }

      onSuccess();
    } catch (err) {
      setErrors({
        submit: parseApiError(err, "Failed to save customer"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (field, extra = "") =>
    `theme-input block w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all ${
      errors[field] ? "ring-2 ring-red-400" : ""
    } ${extra}`;

  const Field = ({
    icon: Icon,
    name,
    label,
    type = "text",
    placeholder,
    required = false,
  }) => (
    <div>
      <label
        className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
        style={{
          color: "var(--text-3)",
        }}
      >
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      <div className="relative">
        <Icon
          size={16}
          className="absolute left-3.5 top-3"
          style={{
            color: "var(--text-3)",
          }}
        />

        <input
          name={name}
          type={type}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className={fieldClass(name, "pl-10")}
          autoComplete={name === "full_name" ? "name" : name}
        />
      </div>

      {errors[name] && (
        <p className="mt-1.5 text-xs text-red-400">{errors[name]}</p>
      )}
    </div>
  );

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
            background: "rgba(139,92,246,.12)",
            color: "#8b5cf6",
          }}
        >
          {isEdit ? <UserRound size={19} /> : <UserPlus size={19} />}
        </div>

        <div>
          <h3
            className="text-sm font-bold"
            style={{
              color: "var(--text-1)",
            }}
          >
            {isEdit ? "Edit customer" : "Add customer"}
          </h3>

          <p
            className="text-xs mt-0.5"
            style={{
              color: "var(--text-3)",
            }}
          >
            {isEdit
              ? "Update the customer's contact details."
              : "Create a customer profile for new orders."}
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

      <Field
        icon={UserRound}
        name="full_name"
        label="Full Name"
        placeholder="e.g. Yash Yadav"
        required
      />

      <Field
        icon={Mail}
        name="email"
        label="Email"
        type="email"
        placeholder="yash@example.com"
        required
      />

      <Field
        icon={Phone}
        name="phone"
        label="Phone"
        placeholder="+91 7607678680"
      />

      {/* Footer */}

      <div
        className="flex justify-end gap-2 pt-4"
        style={{
          borderTop: "1px solid var(--divider)",
        }}
      >
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
            boxShadow: "0 4px 12px rgba(139,92,246,.3)",
          }}
        >
          {submitting ? (
            <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          ) : (
            <Save size={15} />
          )}

          {submitting
            ? isEdit
              ? "Saving..."
              : "Adding..."
            : isEdit
              ? "Save Changes"
              : "Add Customer"}
        </button>
      </div>
    </form>
  );
}
