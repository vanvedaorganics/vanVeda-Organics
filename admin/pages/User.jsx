import React, { useEffect, useState } from "react";
import { Button, DataTable, Modal, AdminUserForm } from "../components";
import { Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "../../src/store/usersSlice";
import AuthService from "../../src/appwrite/authService";

function User() {
  const dispatch = useDispatch();
  const {
    items: users,
    loading,
    error,
    fetched,
  } = useSelector((state) => state.users);

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [showTeamMembers, setShowTeamMembers] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);

  // Client Users table columns
  const userColumns = [
    { header: "User ID", accessor: "user_id" },
    { header: "Name", accessor: "displayName" },
    { header: "Phone", accessor: "phone" },
    {
      header: "Address",
      accessor: "address",
      render: (row) => {
        const addr = JSON.parse(row.address[0]);
        return `${addr.residencyAddress}, ${addr.landmark}, ${addr.street}, ${addr.pincode}, ${addr.city}, ${addr.state}`;
      },
    },
    { header: "Email", accessor: "email" },
  ];

  // Team Members table columns
  const teamColumns = [
    { header: "User Name", accessor: "userName" },
    { header: "Email", accessor: "email" },
    {
      header: "Roles",
      accessor: "roles",
      render: (row) => row.roles.join(", "),
    },
  ];

  // Fetch client users (from Users collection)
  useEffect(() => {
    if (!fetched && !loading) {
      dispatch(fetchUsers());
    }
  }, [dispatch, fetched, loading]);

  // Fetch team members (from Teams API)
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (showTeamMembers) {
        setTeamLoading(true);
        try {
          const res = await AuthService.listTeamMemberships();         
          if (res.memberships) {
            const formatted = res.memberships.map((m) => ({
              userName: m.user?.name ?? "Unknown",
              email: m.user?.email ?? "N/A",
              roles: m.roles || [],
            }));
            setTeamMembers(formatted);
          }
        } catch (err) {
          console.error("Error fetching team members:", err);
        } finally {
          setTeamLoading(false);
        }
      }
    };

    fetchTeamMembers();
  }, [showTeamMembers]);

  return (
    <div className="p-6">
      <Modal
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        title="Add Admin User"
      >
        <AdminUserForm onSuccess={() => setUserModalOpen(false)} />
      </Modal>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl space-grotesk-bold text-[#084629]">
            User Management
          </h1>
          <h2 className="text-lg space-grotesk-medium text-gray-600 mb-4">
            Manage Client Users or Team Members
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant=""
            className="bg-[#dfb96a] focus:ring-0 hover:bg-[#c7a55c] text-center "
            onClick={() => setUserModalOpen(true)}
            disabled
          >
            <Plus size={15} className="mr-1" /> Add Users
          </Button>

          {/* Toggle button */}
          <Button
            variant=""
            className="bg-gray-200 hover:bg-gray-300 text-black"
            onClick={() => setShowTeamMembers((prev) => !prev)}
            
          >
            {showTeamMembers ? "Show Client Users" : "Show Admin Members"}
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={showTeamMembers ? teamColumns : userColumns}
        data={showTeamMembers ? teamMembers : users}
        caption={showTeamMembers ? "Team Members" : "Client Users"}
        loading={showTeamMembers ? teamLoading : loading}
        error={error}
        pageSize={10}
      />
    </div>
  );
}

export default User;
