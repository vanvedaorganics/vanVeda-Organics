import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "../../src/store/usersSlice";

export default function UserList() {
  const dispatch = useDispatch();
  const { items: users, loading, error } = useSelector((state) => state.users);

  // Fetch users only if store is empty (optional optimization)
  useEffect(() => {
    if (users.length === 0) {
      dispatch(fetchUsers());
    }
  }, [dispatch, users.length]);

  if (loading) return <p className="p-4 text-gray-600">Loading users...</p>;
  if (error) return <p className="p-4 text-red-500">Error: {error}</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 text-[#084629]">User List</h2>

      {users.length === 0 ? (
        <p className="text-gray-500">No users found.</p>
      ) : (
        <div className="overflow-x-auto border rounded-md shadow-sm bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Email
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.$id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{user.$id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.email || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
