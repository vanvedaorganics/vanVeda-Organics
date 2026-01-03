import React, { useEffect, useState } from "react";
import { DataTable } from "../components";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../../src/store/ordersSlice";
import appwriteService from "../../src/appwrite/appwriteConfigService";

function Orders() {
  const dispatch = useDispatch();
  const {
    items: orders,
    loading,
    error,
    fetched,
  } = useSelector((state) => state.orders);

  const [rows, setRows] = useState([]);
  const [rowLoading, setRowLoading] = useState({});

  const paymentStatusOptions = ["Pending", "Paid", "Failed"];
  const orderStatusOptions = ["pending", "cancelled", "delivered", "shipped"];
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
    if (s === "delivered") return "text-green-600";
    if (s === "shipped") return "text-blue-600";
    if (s === "cancelled") return "text-red-600";
    return "text-amber-600";
  };

  useEffect(() => {
    setRows(orders || []);
  }, [orders]);

  const handleStatusChange = async (orderId, field, value) => {
    const prevRows = rows;
    setRowLoading((prev) => ({ ...prev, [orderId]: true }));
    setRows((current) =>
      current.map((r) =>
        r.$id === orderId
          ? {
              ...r,
              [field === "paymentStatus"
                ? "paymentStatus"
                : "fulfillmentStatus"]: value,
            }
          : r
      )
    );

    try {
      const payload =
        field === "paymentStatus"
          ? { paymentStatus: value }
          : { fulfillmentStatus: value };
      await appwriteService.updateOrder(orderId, payload);
    } catch (err) {
      console.error("Failed to update order status", err);
      setRows(prevRows);
    } finally {
      setRowLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // Safely parse items payload from order
  const renderOrderItems = (row) => {
    try {
      const parsed =
        typeof row.items === "string" ? JSON.parse(row.items) : row.items;
      const list = Array.isArray(parsed?.items) ? parsed.items : [];
      if (!list.length) return "—";
      return (
        <div className="space-y-1">
          {list.map((item, idx) => (
            <div key={idx} className="text-sm leading-tight">
              <div className="font-semibold text-[#084629]">
                {item.name || "Item"}
              </div>
              <div className="text-xs text-gray-600">
                {item.packaging_size?.sizeLabel
                  ? `Size: ${item.packaging_size.sizeLabel} • `
                  : ""}
                Qty: {item.qty ?? 0}
                {typeof item.price_cents === "number"
                  ? ` • ₹${(item.price_cents / 100).toFixed(2)}`
                  : ""}
                {typeof item.item_total_cents === "number"
                  ? ` (Total: ₹${(item.item_total_cents / 100).toFixed(2)})`
                  : ""}
              </div>
              {item.batch && (item.batch.name || item.batch.delivery_date) && (
                <div className="text-[11px] text-[#084629]">
                  Batch: {item.batch.name || "N/A"}
                  {item.batch.delivery_date
                    ? ` • Delivery: ${item.batch.delivery_date}`
                    : ""}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    } catch {
      return "—";
    }
  };

  const columns = [
    { header: "Order No.", accessor: "$id" },
    { header: "Customer", accessor: "userName" },
    { header: "Items", accessor: "items", render: renderOrderItems },
    {
      header: "Shipping Address",
      accessor: "shippingAddress",
      render: (row) => {
        const address = JSON.parse(row.shippingAddress);
        return `${address.residencyAddress}, ${address.landmark}, ${address.street}, ${address.pincode}, ${address.city}, ${address.state}`;
      },
    },
    {
      header: "Total Amt.",
      accessor: "total_cents",
      render: (row) => `₹${(row.total_cents / 100).toFixed(2)}`,
    },
    {
      header: "Order Status",
      accessor: "fulfillmentStatus",
      render: (row) => (
        <select
          className={`border rounded px-2 py-1 text-sm ${getOrderStatusClass(
            row.fulfillmentStatus || orderStatusOptions[0]
          )}`}
          value={row.fulfillmentStatus || orderStatusOptions[0]}
          disabled={!!rowLoading[row.$id]}
          onChange={(e) =>
            handleStatusChange(row.$id, "fulfillmentStatus", e.target.value)
          }
        >
          {orderStatusOptions.map((status) => (
            <option
              key={status}
              value={status}
              style={{
                color:
                  status === "delivered"
                    ? "#16a34a"
                    : status === "shipped"
                    ? "#2563eb"
                    : status === "cancelled"
                    ? "#dc2626"
                    : "#b45309",
              }}
            >
              {capitalizeFirst(status)}
            </option>
          ))}
        </select>
      ),
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
          onChange={(e) =>
            handleStatusChange(row.$id, "paymentStatus", e.target.value)
          }
        >
          {paymentStatusOptions.map((status) => (
            <option
              key={status}
              value={status}
              style={{
                color:
                  status === "Paid"
                    ? "#16a34a"
                    : status === "Failed"
                    ? "#dc2626"
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
  }, [dispatch, fetched, loading]);

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
