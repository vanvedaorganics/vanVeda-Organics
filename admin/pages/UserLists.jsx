import React, { useState } from "react";
import { Button, DataTable, Modal, AdminUserForm } from "../components";
import { Plus } from "lucide-react";

function UserLists() {
  const [userModalOpen, setUserModalOpen] = useState(false);

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
            Manage Admin Users Here
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
      {/* <DataTable ... /> */}
    </div>
  );
}

export default UserLists;