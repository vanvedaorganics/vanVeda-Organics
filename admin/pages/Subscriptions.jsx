import React, { useEffect, useState } from "react";
import { DataTable } from "../components";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../../src/store/productsSlice";
import appwriteService from "../../src/appwrite/appwriteConfigService";
import { Calendar, XCircle, Package } from "lucide-react";

function Subscriptions() {
  const dispatch = useDispatch();
  const { items: products, fetched: productsFetched } = useSelector((state) => state.products);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rowLoading, setRowLoading] = useState({});

  useEffect(() => {
    if (!productsFetched) {
      dispatch(fetchProducts());
    }
    loadSubscriptions();
  }, [dispatch, productsFetched]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const docs = await appwriteService.listSubscriptions();
      setSubscriptions(docs || []);
    } catch (err) {
      console.error("Failed to load subscriptions", err);
      setError("Failed to load subscriptions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subId) => {
    if (!window.confirm("Are you sure you want to cancel this subscription?")) return;
    
    setRowLoading((prev) => ({ ...prev, [subId]: true }));
    try {
      await appwriteService.updateSubscription(subId, { status: "cancelled" });
      setSubscriptions((current) =>
        current.map((s) => (s.$id === subId ? { ...s, status: "cancelled" } : s))
      );
    } catch (err) {
      console.error("Failed to cancel subscription", err);
      alert("Failed to cancel subscription: " + err.message);
    } finally {
      setRowLoading((prev) => ({ ...prev, [subId]: false }));
    }
  };

  const capitalizeFirst = (str = "") =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  const renderProduct = (row) => {
    const product = products?.find((p) => p.slug === row.product_id);
    let pack = row.packaging_size;
    try {
      pack = typeof pack === "string" ? JSON.parse(pack) : pack;
    } catch {
      pack = { sizeLabel: "" };
    }

    return (
      <div className="flex items-center gap-2">
        <Package size={16} className="text-[#084629]" />
        <div>
          <div className="font-semibold text-[#084629]">{product?.name || row.product_id}</div>
          <div className="text-xs text-gray-500">{pack?.sizeLabel || "—"}</div>
        </div>
      </div>
    );
  };

  const columns = [
    { header: "Sub ID", accessor: "$id" },
    { header: "User ID", accessor: "user_id" },
    { header: "Product", accessor: "product_id", render: renderProduct },
    { header: "Qty", accessor: "quantity" },
    { header: "Interval", accessor: "interval", render: (row) => capitalizeFirst(row.interval) },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
            row.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Payment",
      accessor: "paymentMode",
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-700">{row.paymentMode || "Online"}</span>
          <span className={`text-[10px] uppercase font-black ${row.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
            {row.paymentStatus || 'pending'}
          </span>
        </div>
      )
    },
    {
      header: "Cycles",
      accessor: "remaining_cycles",
      render: (row) => (
        <div className="flex items-center gap-1">
          <span className="font-bold text-[#084629]">{row.remaining_cycles || row.total_cycles || 1}</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-500">{row.total_cycles || 1}</span>
        </div>
      )
    },
    {
      header: "Upfront",
      accessor: "is_upfront_paid",
      render: (row) => row.is_upfront_paid ? (
        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">YES</span>
      ) : (
        <span className="text-gray-400 text-[10px]">NO</span>
      )
    },
    {
      header: "Next Order",
      accessor: "nextOrderAt",
      render: (row) => row.nextOrderAt ? new Date(row.nextOrderAt).toLocaleDateString() : "—",
    },
    {
      header: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === "active" && (
            <button
              onClick={() => handleCancelSubscription(row.$id)}
              disabled={rowLoading[row.$id]}
              className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-md transition-all text-xs font-bold"
            >
              {rowLoading[row.$id] ? (
                <span className="h-3 w-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <XCircle size={14} />
              )}
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl space-grotesk-bold text-[#084629]">Subscriptions Management</h1>
          <h2 className="text-lg space-grotesk-medium text-gray-600">View and Manage Recurring Orders</h2>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={subscriptions}
        caption="Manage Subscriptions Here"
        loading={loading}
        error={error}
        pageSize={10}
      />
    </div>
  );
}

export default Subscriptions;
