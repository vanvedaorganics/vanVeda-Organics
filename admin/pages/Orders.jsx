import React, { useEffect, useState } from "react";
import { DataTable } from "../components";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../../src/store/ordersSlice";
import { fetchUsers } from "../../src/store/usersSlice";
import appwriteService from "../../src/appwrite/appwriteConfigService";
import { MessageCircle, Mail } from "lucide-react";

// Helper: safely parse JSON string
const safeJSON = (str, fallback = {}) => {
  try {
    return typeof str === "string" ? JSON.parse(str) : (str ?? fallback);
  } catch {
    return fallback;
  }
};

// Helper: extract embedded _meta from the items JSON field
// New orders store userName/email/phone inside items._meta
const getOrderMeta = (order) => {
  const parsed = safeJSON(order.items, {});
  return parsed._meta || {};
};

function Orders() {
  const dispatch = useDispatch();
  const {
    items: orders,
    loading,
    error,
    fetched,
  } = useSelector((state) => state.orders);

  const {
    items: usersList,
    fetched: usersFetched,
    loading: usersLoading,
  } = useSelector((state) => state.users);

  const [rows, setRows] = useState([]);
  const [rowLoading, setRowLoading] = useState({});

  const paymentStatusOptions = ["Pending", "Paid", "Failed"];
  const orderStatusOptions = ["pending", "cancelled", "delivered", "shipped"];

  const getCommunicationTemplates = (order) => {
    const orderId = order.$id?.slice(-8).toUpperCase();
    const meta = getOrderMeta(order);
    const customerName = meta.userName || order.userName || "Customer";
    // fulfillmentSattus is the DB field (schema typo)
    const status = (order.fulfillmentSattus || order.fulfillmentStatus || "pending").toLowerCase();
    const payment = (order.paymentStatus || "Pending").toLowerCase();

    let waMessage = "";
    let emailSubject = "";
    let emailBody = "";

    if (status === "cancelled") {
      waMessage = `Hello ${customerName}, we regret to inform you that your order #${orderId} has been cancelled. If you have any questions, please let us know.`;
      emailSubject = `Order Cancellation - #${orderId}`;
      emailBody = `Hello ${customerName},\n\nYour order #${orderId} has been cancelled. If you didn't request this or have any questions, please contact our support team.`;
    } else if (status === "delivered") {
      waMessage = `Hello ${customerName}, your order #${orderId} has been delivered! We hope you love your True Soil products. Please leave us a review!`;
      emailSubject = `Order Delivered! - #${orderId}`;
      emailBody = `Hello ${customerName},\n\nGreat news! Your order #${orderId} has been delivered. We hope you enjoy your farm-fresh products.\n\nCould you take a moment to leave us a review? Your feedback helps our farmers!`;
    } else if (status === "shipped") {
      waMessage = `Hello ${customerName}, your order #${orderId} is on its way! It has been shipped and should reach you soon.`;
      emailSubject = `Your Order is Out for Delivery! - #${orderId}`;
      emailBody = `Hello ${customerName},\n\nYour order #${orderId} has been shipped and is on its way to your destination.\n\nThank you for choosing True Soil Organics!`;
    } else {
      if (payment === "pending") {
        waMessage = `Hello ${customerName}, thank you for your order #${orderId}. We are waiting to confirm your payment to begin processing.`;
        emailSubject = `Action Required: Payment Pending for Order #${orderId}`;
        emailBody = `Hello ${customerName},\n\nThank you for your order #${orderId}. We noticed the payment is still pending. Please complete the payment so our farmers can start preparing your fresh harvest.`;
      } else {
        waMessage = `Hello ${customerName}, we've received your order #${orderId} and our farmers are now preparing your items!`;
        emailSubject = `Order Confirmed - #${orderId}`;
        emailBody = `Hello ${customerName},\n\nYour order #${orderId} is confirmed and our farmers at Gir are now preparing your items for shipment. We will notify you once it's on the way!`;
      }
    }

    return {
      wa: encodeURIComponent(waMessage),
      emailSub: encodeURIComponent(emailSubject),
      emailBody: encodeURIComponent(emailBody),
    };
  };

  const capitalizeFirst = (str = "") =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  const getPaymentStatusClass = (status = "") => {
    const s = status.toLowerCase();
    if (s === "paid") return "text-green-600";
    if (s === "failed") return "text-red-600";
    return "text-amber-600";
  };

  const getOrderStatusClass = (status = "") => {
    const s = status.toLowerCase();
    if (s === "delivered" || s === "completed") return "text-green-600 font-bold";
    if (s === "shipped") return "text-blue-600 font-bold";
    if (s === "cancelled") return "text-red-600 font-bold";
    return "text-amber-600 font-bold";
  };

  useEffect(() => {
    setRows(orders || []);
  }, [orders]);

  const handleStatusChange = async (orderId, field, value) => {
    const prevRows = rows;
    setRowLoading((prev) => ({ ...prev, [orderId]: true }));

    // Optimistic update: use the typo'd field name for local state
    const displayField = field === "fulfillmentStatus" ? "fulfillmentSattus" : field;
    setRows((current) =>
      current.map((r) => (r.$id === orderId ? { ...r, [displayField]: value } : r))
    );

    try {
      const payload = {};
      if (field === "paymentStatus") {
        payload.paymentStatus = value;
      } else if (field === "fulfillmentStatus") {
        // updateOrder will remap fulfillmentStatus → fulfillmentSattus
        payload.fulfillmentStatus = value;
      } else if (field === "shipment_number") {
        payload.shipment_number = value;
      }
      await appwriteService.updateOrder(orderId, payload);
    } catch (err) {
      console.error("Failed to update order status", err);
      setRows(prevRows);
    } finally {
      setRowLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // Render order items list from the JSON payload
  const renderOrderItems = (row) => {
    try {
      const parsed = typeof row.items === "string" ? JSON.parse(row.items) : row.items;
      const list = Array.isArray(parsed?.items) ? parsed.items : [];
      if (!list.length) return "—";
      return (
        <div className="space-y-1">
          {list.map((item, idx) => (
            <div key={idx} className="text-sm leading-tight">
              <div className="font-semibold text-[#084629]">{item.name || "Item"}</div>
              <div className="text-xs text-gray-600">
                {item.size ? `Size: ${item.size} • ` : ""}
                Qty: {item.qty ?? 0}
                {typeof item.price === "number"
                  ? ` • ₹${(item.price / 100).toFixed(2)}`
                  : ""}
                {typeof item.item_total_cents === "number"
                  ? ` (Total: ₹${(item.item_total_cents / 100).toFixed(2)})`
                  : ""}
              </div>
            </div>
          ))}
        </div>
      );
    } catch {
      return "—";
    }
  };

  // Render shipping address — handles both compact {ra,st,ct,pc,s} and full key formats
  const renderShippingAddress = (row) => {
    try {
      const addr = safeJSON(row.shippingAddress, null);
      if (!addr) return "—";
      const parts = [
        addr.residencyAddress || addr.ra,
        addr.landmark || addr.lm,
        addr.street || addr.st,
        addr.pincode || addr.pc,
        addr.city || addr.ct,
        addr.state || addr.s,
      ].filter(Boolean);
      return parts.join(", ") || "—";
    } catch {
      return "—";
    }
  };

  const columns = [
    { header: "Order No.", accessor: "$id" },
    {
      header: "Customer",
      accessor: "userId",
      render: (row) => {
        const meta = getOrderMeta(row);
        return meta.userName || row.userName || "—";
      },
    },
    {
      header: "Shipment No.",
      accessor: "shipment_number",
      render: (row) => (
        <div className="flex flex-col gap-1">
          <input
            type="text"
            placeholder="Add Shipment #"
            className="border border-[#E7CE9D]/40 rounded-lg px-2 py-1 text-xs focus:border-[#28543d] outline-none w-32"
            defaultValue={row.shipment_number || ""}
            onBlur={(e) => {
              if (e.target.value !== (row.shipment_number || "")) {
                handleStatusChange(row.$id, "shipment_number", e.target.value);
              }
            }}
          />
        </div>
      ),
    },
    { header: "Items", accessor: "items", render: renderOrderItems },
    {
      header: "Shipping Address",
      accessor: "shippingAddress",
      render: renderShippingAddress,
    },
    {
      header: "Total Amt.",
      accessor: "total_cents",
      render: (row) => `₹${(row.total_cents / 100).toFixed(2)}`,
    },
    {
      header: "Order Status",
      accessor: "fulfillmentSattus",
      render: (row) => {
        const currentStatus = row.fulfillmentSattus || row.fulfillmentStatus || orderStatusOptions[0];
        return (
          <select
            className={`border rounded px-2 py-1 text-sm ${getOrderStatusClass(currentStatus)}`}
            value={currentStatus}
            disabled={!!rowLoading[row.$id]}
            onChange={(e) => handleStatusChange(row.$id, "fulfillmentStatus", e.target.value)}
          >
            {orderStatusOptions.map((status) => (
              <option
                key={status}
                value={status}
                style={{
                  color:
                    status === "delivered" ? "#16a34a"
                    : status === "shipped" ? "#2563eb"
                    : status === "cancelled" ? "#dc2626"
                    : "#b45309",
                }}
              >
                {capitalizeFirst(status)}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      header: "Payment Status",
      accessor: "paymentStatus",
      render: (row) => (
        <select
          className={`border rounded px-2 py-1 text-sm ${getPaymentStatusClass(
            row.paymentStatus || paymentStatusOptions[0]
          )}`}
          value={row.paymentStatus || paymentStatusOptions[0]}
          disabled={!!rowLoading[row.$id]}
          onChange={(e) => handleStatusChange(row.$id, "paymentStatus", e.target.value)}
        >
          {paymentStatusOptions.map((status) => (
            <option
              key={status}
              value={status}
              style={{
                color:
                  status === "Paid" ? "#16a34a"
                  : status === "Failed" ? "#dc2626"
                  : "#b45309",
              }}
            >
              {capitalizeFirst(status)}
            </option>
          ))}
        </select>
      ),
    },
    { header: "Payment Mode", accessor: "paymentMode" },
    {
      header: "Contact",
      accessor: "actions",
      render: (row) => {
        const templates = getCommunicationTemplates(row);
        const meta = getOrderMeta(row);

        // Fallback: look up user in global users list for old orders that lack _meta
        const linkedUser = usersList?.find(
          (u) => u.$id === row.userId || u.user_id === row.userId
        );

        // Phone resolution: _meta → top-level (legacy) → linked profile
        const rawPhoneInput = (
          meta.userPhone || row.userPhone || linkedUser?.phone || ""
        ).toString();
        let rawPhone = rawPhoneInput.replace(/\D/g, "");
        if (rawPhone.startsWith("91") && rawPhone.length > 10) rawPhone = rawPhone.slice(2);
        if (rawPhone.startsWith("0")) rawPhone = rawPhone.slice(1);
        const phone = rawPhone.length === 10 ? rawPhone : null;
        const waUrl = phone ? `https://wa.me/91${phone}?text=${templates.wa}` : "#";

        // Email resolution: _meta → top-level (legacy) → linked profile
        const destinationEmail =
          meta.userEmail || row.userEmail || linkedUser?.email || "";
        const gmailUrl = destinationEmail
          ? `https://mail.google.com/mail/u/truesoilorganic@gmail.com/compose?view=cm&fs=1&to=${destinationEmail}&su=${templates.emailSub}&body=${templates.emailBody}`
          : "#";

        return (
          <div className="flex items-center gap-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={phone ? "Message on WhatsApp" : "Phone number missing in order & profile"}
              onClick={(e) => e.stopPropagation()}
              className={`p-1.5 rounded-lg transition-all shadow-sm ${
                phone
                  ? "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <MessageCircle size={16} />
            </a>
            <a
              href={gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={
                destinationEmail
                  ? "Send via Gmail (truesoilorganic@gmail.com)"
                  : "Email missing in order & profile"
              }
              onClick={(e) => e.stopPropagation()}
              className={`p-1.5 rounded-lg transition-all shadow-sm ${
                destinationEmail
                  ? "bg-blue-50 text-[#DB4437] hover:bg-[#DB4437] hover:text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Mail size={16} />
            </a>
          </div>
        );
      },
    },
    {
      header: "",
      accessor: "__rowLoader",
      render: (row) =>
        rowLoading[row.$id] ? (
          <div className="flex justify-center w-full">
            <span className="h-5 w-5 border-2 border-[#084629] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex justify-center w-full text-transparent">•</div>
        ),
    },
  ];

  useEffect(() => {
    if (!fetched && !loading) {
      dispatch(fetchOrders());
    }
    if (!usersFetched && !usersLoading) {
      dispatch(fetchUsers());
    }
  }, [dispatch, fetched, loading, usersFetched, usersLoading]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl space-grotesk-bold text-[#084629]">
            Orders Management
          </h1>
          <h2 className="text-lg space-grotesk-medium text-gray-600 mb-4">
            Manage Orders Here
          </h2>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        caption="Manage Orders Here"
        loading={loading}
        error={error}
        pageSize={10}
      />
    </div>
  );
}

export default Orders;
