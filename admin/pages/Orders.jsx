import React, { useEffect } from "react";
import { DataTable } from "../components";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders } from "../../src/store/ordersSlice";
// import appwriteService from "../../src/appwrite/appwriteConfigService";

function Orders() {
  const dispatch = useDispatch();
  const {
    items: orders,
    loading,
    error,
    fetched,
  } = useSelector((state) => state.orders);

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
    { header: "Order Status", accessor: "fulfillmentStatus" },
    { header: "Payment Status", accessor: "paymentStatus" },
    { header: "Payment Mode", accessor: "paymentMode" },
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
        data={orders}
        caption="Manage Orders Here"
        loading={loading}
        error={error}
        pageSize={10}
      />
    </div>
  );
}

export default Orders;
