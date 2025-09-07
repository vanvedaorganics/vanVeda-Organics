import React, { useEffect, useState } from "react";
import { Button, DataTable, Modal, AdminUserForm } from "../components";
import { Plus } from "lucide-react";
// import conf from "../../src/conf/conf";
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from "../../src/store/usersSlice";
// import appwriteService from "../../src/appwrite/appwriteConfigService";

function User() {
  const dispatch = useDispatch();
  const {
    items: users,
    loading,
    error,
    fetched,
  } = useSelector((state) => state.users)

  const [userModalOpen, setUserModalOpen] = useState(false);

  const columns = [
    { header: 'User ID', accessor: "user_id" },
    { header: 'Name', accessor: "displayName" },
    { header: 'Phone', accessor: "phone" },
    { 
      header: 'Address', 
      accessor: "address",
      render: (row) => `${row.address[0]}` 
    },
    { header: "Email", accessor: "email" },
  ]

  useEffect(() => {
    if( !fetched && !loading){
      dispatch(fetchUsers());
      console.log('method dispatched');
      
    }
  }, [dispatch, fetched, loading])

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
            Manage Client Users Here
          </h2>
        </div>
        <div>
          <Button
            variant=""
            className="bg-[#dfb96a] focus:ring-0 hover:bg-[#c7a55c] text-center "
            onClick={() => setUserModalOpen(true)}
          >
            <Plus size={15} className="mr-1" /> Add Users
          </Button>
        </div>
      </div>
        <DataTable 
          columns = {columns}
          data = {users}
          caption = 'Client Users'
          loading = {loading}
          error = {error}
          pageSize= {10}
        />
    </div>
  );
}

export default User;