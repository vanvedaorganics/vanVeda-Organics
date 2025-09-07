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

  const columns = [
    { header: "Order No.", accessor: "orderNumber" },
    { header: "Customer", accessor: "userName" },
    { header: "Items", accessor: "items" },
    { header: "Shipping Address", accessor: "shippinhAddress" },
    {
      header: "Total Amt.",
      accessor: "total_cents",
      render: (row) => `₹${(row.price_cents / 100).toFixed(2)}`,
    },
    { header: "Order Status", accessor: "fulfillmentStatus" },
    { header: "Payment Status", accessor: "paymentStatus" },
    { header: "Payment Mode", accessor: "paymentMode" },
    { header: "Actions", accessor: "actions" },
  ];

  useEffect(() => {
      if (!fetched && !loading) {
        dispatch((fetchOrders()));
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
